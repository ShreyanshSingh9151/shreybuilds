package providers

import (
	"log"
)

// GeminiWithFallback wraps a real Gemini provider and falls back to MockGemini
// if the real API call fails (e.g., quota exceeded, network error).
type GeminiWithFallback struct {
	real     *GeminiProvider
	fallback *MockGemini
}

// NewGeminiWithFallback creates a provider that tries the real Gemini API first
// and silently falls back to mock responses on failure.
func NewGeminiWithFallback(apiKey string) *GeminiWithFallback {
	return &GeminiWithFallback{
		real:     NewGeminiProvider(apiKey),
		fallback: &MockGemini{},
	}
}

func (g *GeminiWithFallback) Name() string { return "gemini" }

func (g *GeminiWithFallback) Summarize(content, tone, length string) (string, error) {
	result, err := g.real.Summarize(content, tone, length)
	if err != nil {
		log.Printf("[gemini-fallback] Summarize failed, using mock: %v", err)
		return g.fallback.Summarize(content, tone, length)
	}
	return result, nil
}

func (g *GeminiWithFallback) GenerateReply(content, sender, subject, tone, length, signature, instructions string) (string, error) {
	result, err := g.real.GenerateReply(content, sender, subject, tone, length, signature, instructions)
	if err != nil {
		log.Printf("[gemini-fallback] GenerateReply failed, using mock: %v", err)
		return g.fallback.GenerateReply(content, sender, subject, tone, length, signature, instructions)
	}
	return result, nil
}

func (g *GeminiWithFallback) Rewrite(content, tone, length string) (string, error) {
	result, err := g.real.Rewrite(content, tone, length)
	if err != nil {
		log.Printf("[gemini-fallback] Rewrite failed, using mock: %v", err)
		return g.fallback.Rewrite(content, tone, length)
	}
	return result, nil
}

func (g *GeminiWithFallback) Classify(content, subject, sender string) (string, float64, []string, error) {
	cat, conf, labels, err := g.real.Classify(content, subject, sender)
	if err != nil {
		log.Printf("[gemini-fallback] Classify failed, using mock: %v", err)
		return g.fallback.Classify(content, subject, sender)
	}
	return cat, conf, labels, nil
}

func (g *GeminiWithFallback) EstimatePriority(content, subject, sender string) (string, int, string, error) {
	level, score, reason, err := g.real.EstimatePriority(content, subject, sender)
	if err != nil {
		log.Printf("[gemini-fallback] EstimatePriority failed, using mock: %v", err)
		return g.fallback.EstimatePriority(content, subject, sender)
	}
	return level, score, reason, nil
}

func (g *GeminiWithFallback) ExtractActionItems(content string) ([]string, error) {
	items, err := g.real.ExtractActionItems(content)
	if err != nil {
		log.Printf("[gemini-fallback] ExtractActionItems failed, using mock: %v", err)
		return g.fallback.ExtractActionItems(content)
	}
	return items, nil
}
