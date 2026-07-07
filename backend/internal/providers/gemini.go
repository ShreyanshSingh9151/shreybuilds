package providers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

// GeminiProvider calls the real Google Gemini (Generative Language) API.
// It implements the LLMProvider interface using the v1beta REST endpoint.
type GeminiProvider struct {
	apiKey     string
	model      string
	httpClient *http.Client
}

// NewGeminiProvider creates a provider backed by a real Gemini API key.
func NewGeminiProvider(apiKey string) *GeminiProvider {
	return &GeminiProvider{
		apiKey: apiKey,
		model:  "gemini-2.0-flash",
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

func (g *GeminiProvider) Name() string { return "gemini" }

// ---- Gemini REST request / response shapes ----

type geminiRequest struct {
	Contents         []geminiContent         `json:"contents"`
	GenerationConfig *geminiGenerationConfig `json:"generationConfig,omitempty"`
}

type geminiContent struct {
	Parts []geminiPart `json:"parts"`
}

type geminiPart struct {
	Text string `json:"text"`
}

type geminiGenerationConfig struct {
	Temperature     float64 `json:"temperature,omitempty"`
	MaxOutputTokens int     `json:"maxOutputTokens,omitempty"`
}

type geminiResponse struct {
	Candidates []struct {
		Content struct {
			Parts []struct {
				Text string `json:"text"`
			} `json:"parts"`
		} `json:"content"`
	} `json:"candidates"`
	Error *struct {
		Message string `json:"message"`
		Code    int    `json:"code"`
	} `json:"error,omitempty"`
}

// call sends a prompt to Gemini and returns the text response.
func (g *GeminiProvider) call(prompt string, maxTokens int, temperature float64) (string, error) {
	url := fmt.Sprintf(
		"https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s",
		g.model, g.apiKey,
	)

	reqBody := geminiRequest{
		Contents: []geminiContent{
			{Parts: []geminiPart{{Text: prompt}}},
		},
		GenerationConfig: &geminiGenerationConfig{
			Temperature:     temperature,
			MaxOutputTokens: maxTokens,
		},
	}

	bodyBytes, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("gemini: marshal request: %w", err)
	}

	req, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(bodyBytes))
	if err != nil {
		return "", fmt.Errorf("gemini: create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := g.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("gemini: http call: %w", err)
	}
	defer resp.Body.Close()

	respBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("gemini: read response: %w", err)
	}

	var gemResp geminiResponse
	if err := json.Unmarshal(respBytes, &gemResp); err != nil {
		return "", fmt.Errorf("gemini: unmarshal response: %w", err)
	}

	if gemResp.Error != nil {
		return "", fmt.Errorf("gemini API error (%d): %s", gemResp.Error.Code, gemResp.Error.Message)
	}

	if len(gemResp.Candidates) == 0 ||
		len(gemResp.Candidates[0].Content.Parts) == 0 {
		return "", fmt.Errorf("gemini: empty response — no candidates returned")
	}

	return strings.TrimSpace(gemResp.Candidates[0].Content.Parts[0].Text), nil
}

// ---- LLMProvider interface ----

func (g *GeminiProvider) Summarize(content, tone, length string) (string, error) {
	maxTokens := 512
	if length == "long" {
		maxTokens = 1024
	} else if length == "short" {
		maxTokens = 256
	}

	prompt := fmt.Sprintf(`You are MailPilot AI, an intelligent email assistant.
Summarize the following email thread. Tone: %s. Length preference: %s.

Provide:
- A clear, structured summary of the key points
- The main ask or concern
- Any deadlines or action items mentioned
- The overall sentiment

Email thread:
---
%s
---`, tone, length, content)

	return g.call(prompt, maxTokens, 0.4)
}

func (g *GeminiProvider) GenerateReply(content, sender, subject, tone, length, signature, instructions string) (string, error) {
	maxTokens := 512
	if length == "long" {
		maxTokens = 1024
	} else if length == "short" {
		maxTokens = 256
	}

	extra := ""
	if instructions != "" {
		extra = fmt.Sprintf("\nAdditional instructions: %s", instructions)
	}

	sigBlock := ""
	if signature != "" {
		sigBlock = fmt.Sprintf("\nEnd the reply with this signature:\n%s", signature)
	}

	prompt := fmt.Sprintf(`You are MailPilot AI, an intelligent email assistant.
Draft a reply to the following email. Tone: %s. Length: %s.

From: %s
Subject: %s
%s%s

Email content:
---
%s
---

Write only the reply text, ready to send.`, tone, length, sender, subject, extra, sigBlock, content)

	return g.call(prompt, maxTokens, 0.7)
}

func (g *GeminiProvider) Rewrite(content, tone, length string) (string, error) {
	maxTokens := 512
	prompt := fmt.Sprintf(`You are MailPilot AI, an intelligent email assistant.
Rewrite the following email text in a %s tone. Keep the core message but adjust the style. Length preference: %s.

Original text:
---
%s
---

Write only the rewritten text.`, tone, length, content)

	return g.call(prompt, maxTokens, 0.7)
}

func (g *GeminiProvider) Classify(content, subject, sender string) (string, float64, []string, error) {
	prompt := fmt.Sprintf(`You are MailPilot AI, an intelligent email classifier.
Classify this email into exactly ONE category and provide labels.

Subject: %s
From: %s
Content:
---
%s
---

Respond in EXACTLY this format (no markdown, no extra text):
CATEGORY: <one of: escalation, finance, scheduling, status_update, business_development, review_request, general>
CONFIDENCE: <number between 0.0 and 1.0>
LABELS: <comma-separated labels, 2-4 labels>`, subject, sender, content)

	result, err := g.call(prompt, 128, 0.2)
	if err != nil {
		return "", 0, nil, err
	}

	// Parse structured response
	category := "general"
	confidence := 0.80
	var labels []string

	for _, line := range strings.Split(result, "\n") {
		line = strings.TrimSpace(line)
		if strings.HasPrefix(line, "CATEGORY:") {
			category = strings.TrimSpace(strings.TrimPrefix(line, "CATEGORY:"))
			category = strings.ToLower(strings.ReplaceAll(category, " ", "_"))
		} else if strings.HasPrefix(line, "CONFIDENCE:") {
			val := strings.TrimSpace(strings.TrimPrefix(line, "CONFIDENCE:"))
			if _, err := fmt.Sscanf(val, "%f", &confidence); err != nil {
				confidence = 0.80
			}
		} else if strings.HasPrefix(line, "LABELS:") {
			raw := strings.TrimSpace(strings.TrimPrefix(line, "LABELS:"))
			for _, l := range strings.Split(raw, ",") {
				l = strings.TrimSpace(l)
				if l != "" {
					labels = append(labels, l)
				}
			}
		}
	}

	if len(labels) == 0 {
		labels = []string{"general", "needs-review"}
	}

	return category, confidence, labels, nil
}

func (g *GeminiProvider) EstimatePriority(content, subject, sender string) (string, int, string, error) {
	prompt := fmt.Sprintf(`You are MailPilot AI, an intelligent email priority estimator.
Estimate the priority of this email.

Subject: %s
From: %s
Content:
---
%s
---

Respond in EXACTLY this format (no markdown, no extra text):
LEVEL: <one of: critical, high, medium, low>
SCORE: <integer 1-10>
REASON: <one sentence explanation>`, subject, sender, content)

	result, err := g.call(prompt, 128, 0.2)
	if err != nil {
		return "", 0, "", err
	}

	level := "medium"
	score := 5
	reason := "Standard priority email."

	for _, line := range strings.Split(result, "\n") {
		line = strings.TrimSpace(line)
		if strings.HasPrefix(line, "LEVEL:") {
			level = strings.TrimSpace(strings.TrimPrefix(line, "LEVEL:"))
			level = strings.ToLower(level)
		} else if strings.HasPrefix(line, "SCORE:") {
			val := strings.TrimSpace(strings.TrimPrefix(line, "SCORE:"))
			if _, err := fmt.Sscanf(val, "%d", &score); err != nil {
				score = 5
			}
		} else if strings.HasPrefix(line, "REASON:") {
			reason = strings.TrimSpace(strings.TrimPrefix(line, "REASON:"))
		}
	}

	return level, score, reason, nil
}

func (g *GeminiProvider) ExtractActionItems(content string) ([]string, error) {
	prompt := fmt.Sprintf(`You are MailPilot AI. Extract action items from this email.

Content:
---
%s
---

List each action item on its own line, prefixed with "- ". Only list concrete, actionable items. If none, respond with "- No action items identified".`, content)

	result, err := g.call(prompt, 256, 0.3)
	if err != nil {
		return nil, err
	}

	var items []string
	for _, line := range strings.Split(result, "\n") {
		line = strings.TrimSpace(line)
		if strings.HasPrefix(line, "- ") || strings.HasPrefix(line, "* ") {
			item := strings.TrimSpace(line[2:])
			if item != "" {
				items = append(items, item)
			}
		}
	}

	if len(items) == 0 {
		items = []string{"No action items identified"}
	}

	return items, nil
}
