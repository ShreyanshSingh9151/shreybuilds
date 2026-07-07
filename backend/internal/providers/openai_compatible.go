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

// OpenAICompatibleProvider supports OpenAI-style chat completions APIs
// such as OpenRouter and Groq.
type OpenAICompatibleProvider struct {
	apiKey     string
	baseURL    string
	model      string
	logical    string
	httpClient *http.Client
}

func NewOpenAICompatibleProvider(apiKey, baseURL, model string) *OpenAICompatibleProvider {
	return &OpenAICompatibleProvider{
		apiKey:  apiKey,
		baseURL: strings.TrimRight(baseURL, "/"),
		model:   model,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

func (p *OpenAICompatibleProvider) Name() string {
	if p.logical != "" {
		return p.logical
	}
	return "openrouter"
}

func (p *OpenAICompatibleProvider) WithLogicalName(name string) *OpenAICompatibleProvider {
	p.logical = name
	return p
}

type oaMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type oaRequest struct {
	Model       string      `json:"model"`
	Messages    []oaMessage `json:"messages"`
	Temperature float64     `json:"temperature,omitempty"`
	MaxTokens   int         `json:"max_tokens,omitempty"`
}

type oaResponse struct {
	Choices []struct {
		Message oaMessage `json:"message"`
	} `json:"choices"`
	Error *struct {
		Message string `json:"message"`
		Type    string `json:"type"`
		Code    any    `json:"code"`
	} `json:"error,omitempty"`
}

func (p *OpenAICompatibleProvider) call(systemPrompt, userPrompt string, maxTokens int, temperature float64) (string, error) {
	url := p.baseURL + "/chat/completions"

	reqBody := oaRequest{
		Model: p.model,
		Messages: []oaMessage{
			{Role: "system", Content: systemPrompt},
			{Role: "user", Content: userPrompt},
		},
		Temperature: temperature,
		MaxTokens:   maxTokens,
	}

	bodyBytes, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("openai-compatible: marshal request: %w", err)
	}

	req, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(bodyBytes))
	if err != nil {
		return "", fmt.Errorf("openai-compatible: create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+p.apiKey)
	req.Header.Set("HTTP-Referer", "http://localhost")
	req.Header.Set("X-Title", "MailPilot AI")

	resp, err := p.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("openai-compatible: http call: %w", err)
	}
	defer resp.Body.Close()

	respBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("openai-compatible: read response: %w", err)
	}

	var parsed oaResponse
	if err := json.Unmarshal(respBytes, &parsed); err != nil {
		return "", fmt.Errorf("openai-compatible: unmarshal response: %w", err)
	}

	if parsed.Error != nil {
		return "", fmt.Errorf("openai-compatible API error: %s", parsed.Error.Message)
	}

	if len(parsed.Choices) == 0 {
		return "", fmt.Errorf("openai-compatible: empty response")
	}

	result := strings.TrimSpace(parsed.Choices[0].Message.Content)
	if result == "" {
		return "", fmt.Errorf("openai-compatible: empty content")
	}

	return result, nil
}

func (p *OpenAICompatibleProvider) Summarize(content, tone, length string) (string, error) {
	maxTokens := 500
	if length == "long" {
		maxTokens = 900
	} else if length == "short" {
		maxTokens = 220
	}

	return p.call(
		"You are MailPilot AI. Summarize emails clearly and accurately.",
		fmt.Sprintf("Summarize this email thread with tone=%s and length=%s. Include key ask, urgency, and action items.\n\n%s", tone, length, content),
		maxTokens,
		0.3,
	)
}

func (p *OpenAICompatibleProvider) GenerateReply(content, sender, subject, tone, length, signature, instructions string) (string, error) {
	maxTokens := 500
	if length == "long" {
		maxTokens = 900
	} else if length == "short" {
		maxTokens = 220
	}

	extra := ""
	if instructions != "" {
		extra = "\nUser instructions: " + instructions
	}

	sig := ""
	if signature != "" {
		sig = "\nEnd with this signature exactly:\n" + signature
	}

	return p.call(
		"You are MailPilot AI. Write practical, first-person email replies from the user's perspective.",
		fmt.Sprintf("Draft a reply the user can send. Do not impersonate the sender or repeat their email as the final answer. Tone=%s, length=%s.\nIncoming email sender: %s\nSubject: %s%s%s\n\nEmail thread:\n%s\n\nReturn only the reply text written as if the user is responding.", tone, length, sender, subject, extra, sig, content),
		maxTokens,
		0.5,
	)
}

func (p *OpenAICompatibleProvider) Rewrite(content, tone, length string) (string, error) {
	return p.call(
		"You are MailPilot AI. Rewrite the same email in the same speaker's voice while preserving intent.",
		fmt.Sprintf("Rewrite this email in a %s tone with %s length. Preserve the original speaker perspective and do not switch to the other person's point of view. Do not add a new sign-off unless one already exists.\n\n%s", tone, length, content),
		500,
		0.6,
	)
}

func (p *OpenAICompatibleProvider) Classify(content, subject, sender string) (string, float64, []string, error) {
	result, err := p.call(
		"You are an email classifier.",
		fmt.Sprintf("Classify this email into one category from: escalation, finance, scheduling, status_update, business_development, review_request, general.\nSubject: %s\nFrom: %s\nContent: %s\n\nRespond exactly:\nCATEGORY: <category>\nCONFIDENCE: <0-1>\nLABELS: <comma separated labels>", subject, sender, content),
		160,
		0.1,
	)
	if err != nil {
		return "", 0, nil, err
	}

	category := "general"
	confidence := 0.8
	labels := []string{"general", "needs-review"}

	for _, line := range strings.Split(result, "\n") {
		line = strings.TrimSpace(line)
		if strings.HasPrefix(line, "CATEGORY:") {
			category = strings.ToLower(strings.TrimSpace(strings.TrimPrefix(line, "CATEGORY:")))
			category = strings.ReplaceAll(category, " ", "_")
		} else if strings.HasPrefix(line, "CONFIDENCE:") {
			v := strings.TrimSpace(strings.TrimPrefix(line, "CONFIDENCE:"))
			if _, err := fmt.Sscanf(v, "%f", &confidence); err != nil {
				confidence = 0.8
			}
		} else if strings.HasPrefix(line, "LABELS:") {
			raw := strings.TrimSpace(strings.TrimPrefix(line, "LABELS:"))
			parsed := make([]string, 0)
			for _, l := range strings.Split(raw, ",") {
				l = strings.TrimSpace(l)
				if l != "" {
					parsed = append(parsed, l)
				}
			}
			if len(parsed) > 0 {
				labels = parsed
			}
		}
	}

	return category, confidence, labels, nil
}

func (p *OpenAICompatibleProvider) EstimatePriority(content, subject, sender string) (string, int, string, error) {
	result, err := p.call(
		"You estimate email urgency.",
		fmt.Sprintf("Estimate priority for this email.\nSubject: %s\nFrom: %s\nContent: %s\n\nRespond exactly:\nLEVEL: <critical|high|medium|low>\nSCORE: <1-10>\nREASON: <one sentence>", subject, sender, content),
		140,
		0.1,
	)
	if err != nil {
		return "", 0, "", err
	}

	level := "medium"
	score := 5
	reason := "Standard priority business email."

	for _, line := range strings.Split(result, "\n") {
		line = strings.TrimSpace(line)
		if strings.HasPrefix(line, "LEVEL:") {
			level = strings.ToLower(strings.TrimSpace(strings.TrimPrefix(line, "LEVEL:")))
		} else if strings.HasPrefix(line, "SCORE:") {
			v := strings.TrimSpace(strings.TrimPrefix(line, "SCORE:"))
			if _, err := fmt.Sscanf(v, "%d", &score); err != nil {
				score = 5
			}
		} else if strings.HasPrefix(line, "REASON:") {
			reason = strings.TrimSpace(strings.TrimPrefix(line, "REASON:"))
		}
	}

	return level, score, reason, nil
}

func (p *OpenAICompatibleProvider) ExtractActionItems(content string) ([]string, error) {
	result, err := p.call(
		"You extract actionable tasks from emails.",
		fmt.Sprintf("Extract concrete action items from this email. Return one item per line prefixed with '- '. If none, return '- No action items identified'.\n\n%s", content),
		220,
		0.2,
	)
	if err != nil {
		return nil, err
	}

	items := make([]string, 0)
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
