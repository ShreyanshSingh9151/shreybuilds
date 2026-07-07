package services

import (
	"log"
	"math/rand"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/mailpilot-ai/backend/internal/config"
	"github.com/mailpilot-ai/backend/internal/models"
	"github.com/mailpilot-ai/backend/internal/store"
)

// EmailAIService orchestrates AI actions on email content.
type EmailAIService struct {
	cfg         *config.Config
	router      *ModelRouter
	memoryStore *store.MemoryStore
	actionStore *store.ActionStore
}

// NewEmailAIService creates an EmailAIService with all dependencies.
func NewEmailAIService(
	cfg *config.Config,
	router *ModelRouter,
	memoryStore *store.MemoryStore,
	actionStore *store.ActionStore,
) *EmailAIService {
	return &EmailAIService{
		cfg:         cfg,
		router:      router,
		memoryStore: memoryStore,
		actionStore: actionStore,
	}
}

// Summarize produces a summary for the given thread.
func (s *EmailAIService) Summarize(req models.AIActionRequest) (*models.AIActionResponse, error) {
	start := time.Now()
	prefs := s.memoryStore.Get()
	req = s.applyMemoryDefaults(req, prefs)

	decision := s.router.Resolve(req.SelectedModel, "summarize")
	provider := decision.Provider
	tone := req.Tone
	if strings.TrimSpace(tone) == "" {
		tone = prefs.PreferredTone
	}
	contentForSummary := req.Content
	if prefs.CommonInstructions != "" {
		contentForSummary = "User personalization: " + prefs.CommonInstructions + "\n\n" + req.Content
	}
	summary, err := provider.Summarize(contentForSummary, tone, req.Length)
	if err != nil {
		return nil, err
	}

	latency := time.Since(start).Milliseconds() + simulateLatency()
	tokens := estimateTokens(req.Content, summary)
	cost := s.estimateCost(decision.RoutedModel, tokens)
	baseline := s.baselineCost(tokens)
	savings := clampNonNegative(baseline - cost)

	// Extract priority alongside summary
	_, priorityScore, priorityReason, _ := provider.EstimatePriority(req.Content, req.Subject, req.Sender)
	priorityLevel := priorityLevelFromScore(priorityScore)
	actionItems, _ := provider.ExtractActionItems(req.Content)

	resp := &models.AIActionResponse{
		Success:          true,
		ActionType:       "summarize",
		SelectedModel:    decision.SelectedModel,
		RoutedModel:      decision.RoutedModel,
		ActualModel:      decision.ActualModel,
		RouteReason:      decision.RouteReason,
		PriorityReason:   priorityReason,
		ActionItemsCount: len(actionItems),
		Output:           summary,
		Summary:          summary,
		Priority: &models.Priority{
			Level:  priorityLevel,
			Score:  priorityScore,
			Reason: priorityReason,
		},
		ActionItems:     actionItems,
		TokensEstimate:  tokens,
		CostEstimate:    cost,
		BaselineCostUSD: baseline,
		CostSavingsUSD:  savings,
		LatencyMs:       latency,
		Timestamp:       time.Now(),
	}

	s.recordAction(req, resp)
	return resp, nil
}

// Reply generates a reply draft for the given thread.
func (s *EmailAIService) Reply(req models.AIActionRequest) (*models.AIActionResponse, error) {
	start := time.Now()
	prefs := s.memoryStore.Get()
	req = s.applyMemoryDefaults(req, prefs)
	selfThread := isLikelySelfAuthoredThread(req.Sender, prefs)

	decision := s.router.Resolve(req.SelectedModel, "reply")
	provider := decision.Provider

	// Determine tone: use request tone, or infer from sender context
	tone := req.Tone
	if tone == "" {
		tone = prefs.PreferredTone
		if isExternalSender(req.Sender) {
			tone = prefs.ToneForClients
		} else {
			tone = prefs.ToneForInternal
		}
	}

	replySender := req.Sender
	replyInstructions := prefs.CommonInstructions
	replyContent := req.Content
	if selfThread {
		replySender = "the other participant in this thread"
		replyContent = "The visible thread appears to be authored by the user. Draft a follow-up message the user can send next to the other participant.\n\n" + req.Content
		selfThreadNote := "The email thread appears to be written by the user, so draft a follow-up in the user's voice and do not thank the user for their own work. Do not write as if the sender is the user. Avoid recipient-style phrasing like 'thank you for your prompt response' unless it is truly appropriate for a new inbound reply."
		if replyInstructions != "" {
			replyInstructions = selfThreadNote + "\n\nUser instructions: " + replyInstructions
		} else {
			replyInstructions = selfThreadNote
		}
	}

	reply, err := provider.GenerateReply(
		replyContent, replySender, req.Subject,
		tone, req.Length,
		prefs.Signature, replyInstructions,
	)
	if err != nil {
		return nil, err
	}

	latency := time.Since(start).Milliseconds() + simulateLatency()
	tokens := estimateTokens(req.Content, reply)
	cost := s.estimateCost(decision.RoutedModel, tokens)
	baseline := s.baselineCost(tokens)
	savings := clampNonNegative(baseline - cost)

	priorityReason := ""
	if _, _, reason, err := provider.EstimatePriority(req.Content, req.Subject, req.Sender); err == nil {
		priorityReason = reason
	}
	actionItems, _ := provider.ExtractActionItems(req.Content)

	resp := &models.AIActionResponse{
		Success:          true,
		ActionType:       "reply",
		SelectedModel:    decision.SelectedModel,
		RoutedModel:      decision.RoutedModel,
		ActualModel:      decision.ActualModel,
		RouteReason:      decision.RouteReason,
		PriorityReason:   priorityReason,
		ActionItemsCount: len(actionItems),
		Output:           reply,
		ActionItems:      actionItems,
		TokensEstimate:   tokens,
		CostEstimate:     cost,
		BaselineCostUSD:  baseline,
		CostSavingsUSD:   savings,
		LatencyMs:        latency,
		Timestamp:        time.Now(),
	}

	s.recordAction(req, resp)
	return resp, nil
}

// Rewrite rewrites email content with the specified tone.
func (s *EmailAIService) Rewrite(req models.AIActionRequest) (*models.AIActionResponse, error) {
	start := time.Now()
	prefs := s.memoryStore.Get()
	req = s.applyMemoryDefaults(req, prefs)

	decision := s.router.Resolve(req.SelectedModel, "rewrite")
	provider := decision.Provider

	tone := req.Tone
	if tone == "" {
		tone = prefs.PreferredTone
		if isExternalSender(req.Sender) {
			tone = prefs.ToneForClients
		} else {
			tone = prefs.ToneForInternal
		}
	}

	rewriteSource := req.Content
	if req.Subject != "" || req.Sender != "" {
		rewriteSource = "Subject: " + req.Subject + "\nFrom: " + req.Sender + "\n\n" + rewriteSource
	}
	if prefs.CommonInstructions != "" {
		rewriteSource = "User instructions: " + prefs.CommonInstructions + "\n\n" + rewriteSource
	}

	rewritten, err := provider.Rewrite(rewriteSource, tone, req.Length)
	if err != nil {
		return nil, err
	}

	latency := time.Since(start).Milliseconds() + simulateLatency()
	tokens := estimateTokens(req.Content, rewritten)
	cost := s.estimateCost(decision.RoutedModel, tokens)
	baseline := s.baselineCost(tokens)
	savings := clampNonNegative(baseline - cost)

	priorityReason := ""
	if _, _, reason, err := provider.EstimatePriority(req.Content, req.Subject, req.Sender); err == nil {
		priorityReason = reason
	}
	actionItems, _ := provider.ExtractActionItems(req.Content)

	resp := &models.AIActionResponse{
		Success:          true,
		ActionType:       "rewrite",
		SelectedModel:    decision.SelectedModel,
		RoutedModel:      decision.RoutedModel,
		ActualModel:      decision.ActualModel,
		RouteReason:      decision.RouteReason,
		PriorityReason:   priorityReason,
		ActionItemsCount: len(actionItems),
		Output:           rewritten,
		ActionItems:      actionItems,
		TokensEstimate:   tokens,
		CostEstimate:     cost,
		BaselineCostUSD:  baseline,
		CostSavingsUSD:   savings,
		LatencyMs:        latency,
		Timestamp:        time.Now(),
	}

	s.recordAction(req, resp)
	return resp, nil
}

// Classify categorizes the email.
func (s *EmailAIService) Classify(req models.AIActionRequest) (*models.AIActionResponse, error) {
	start := time.Now()
	prefs := s.memoryStore.Get()
	req = s.applyMemoryDefaults(req, prefs)

	decision := s.router.Resolve(req.SelectedModel, "classify")
	provider := decision.Provider
	category, confidence, labels, err := provider.Classify(req.Content, req.Subject, req.Sender)
	if err != nil {
		return nil, err
	}

	// Also estimate priority
	level, score, reason, _ := provider.EstimatePriority(req.Content, req.Subject, req.Sender)

	// Extract action items
	actionItems, _ := provider.ExtractActionItems(req.Content)

	latency := time.Since(start).Milliseconds() + simulateLatency()
	tokens := estimateTokens(req.Content, category+" "+reason)
	cost := s.estimateCost(decision.RoutedModel, tokens)
	baseline := s.baselineCost(tokens)
	savings := clampNonNegative(baseline - cost)

	resp := &models.AIActionResponse{
		Success:          true,
		ActionType:       "classify",
		SelectedModel:    decision.SelectedModel,
		RoutedModel:      decision.RoutedModel,
		ActualModel:      decision.ActualModel,
		RouteReason:      decision.RouteReason,
		PriorityReason:   reason,
		Confidence:       confidence,
		ActionItemsCount: len(actionItems),
		Output:           "Email classified as: " + category,
		Classification: &models.Classification{
			Category:   category,
			Confidence: confidence,
			Labels:     labels,
		},
		Priority: &models.Priority{
			Level:  level,
			Score:  score,
			Reason: reason,
		},
		ActionItems:     actionItems,
		TokensEstimate:  tokens,
		CostEstimate:    cost,
		BaselineCostUSD: baseline,
		CostSavingsUSD:  savings,
		LatencyMs:       latency,
		Timestamp:       time.Now(),
	}

	s.recordAction(req, resp)
	return resp, nil
}

// recordAction persists the action record to the analytics store.
func (s *EmailAIService) recordAction(req models.AIActionRequest, resp *models.AIActionResponse) {
	preview := resp.Output
	if len(preview) > 150 {
		preview = preview[:150] + "..."
	}

	category := ""
	if resp.Classification != nil {
		category = resp.Classification.Category
	}

	confidence := resp.Confidence
	if confidence == 0 && resp.Classification != nil {
		confidence = resp.Classification.Confidence
	}

	if resp.RouteReason != "" {
		log.Printf("[email-ai] action=%s selected=%s routed=%s actual=%s reason=%s", resp.ActionType, resp.SelectedModel, resp.RoutedModel, resp.ActualModel, resp.RouteReason)
	}

	s.actionStore.Append(models.ActionRecord{
		ID:               uuid.New().String(),
		Provider:         req.Provider,
		ThreadID:         req.ThreadID,
		Subject:          req.Subject,
		Sender:           req.Sender,
		ActionType:       resp.ActionType,
		Category:         category,
		SelectedModel:    resp.SelectedModel,
		RoutedModel:      resp.RoutedModel,
		ActualModel:      resp.ActualModel,
		RouteReason:      resp.RouteReason,
		PriorityReason:   resp.PriorityReason,
		Confidence:       confidence,
		ActionItemsCount: resp.ActionItemsCount,
		TokensEst:        resp.TokensEstimate,
		CostEst:          resp.CostEstimate,
		BaselineCostUSD:  resp.BaselineCostUSD,
		CostSavingsUSD:   resp.CostSavingsUSD,
		LatencyMs:        resp.LatencyMs,
		Timestamp:        resp.Timestamp,
		ResultPreview:    preview,
	})
}

// estimateCost calculates a rough cost based on token count and model.
func (s *EmailAIService) estimateCost(model string, tokens int) float64 {
	rate := s.cfg.GPTCostPer1K
	switch model {
	case "claude":
		rate = s.cfg.ClaudeCostPer1K
	case "gemini":
		rate = s.cfg.GeminiCostPer1K
	}
	return float64(tokens) / 1000.0 * rate
}

func (s *EmailAIService) baselineCost(tokens int) float64 {
	return float64(tokens) / 1000.0 * s.cfg.GPTCostPer1K
}

func (s *EmailAIService) applyMemoryDefaults(req models.AIActionRequest, prefs models.UserPreferences) models.AIActionRequest {
	if strings.TrimSpace(req.SelectedModel) == "" {
		req.SelectedModel = prefs.DefaultModel
	}
	if strings.TrimSpace(req.SelectedModel) == "" {
		req.SelectedModel = "auto"
	}
	if strings.TrimSpace(req.Length) == "" {
		req.Length = "medium"
	}
	return req
}

func clampNonNegative(v float64) float64 {
	if v < 0 {
		return 0
	}
	return v
}

// estimateTokens provides a rough token count from input + output content.
func estimateTokens(input, output string) int {
	// Rough approximation: ~4 characters per token for English text
	totalChars := len(input) + len(output)
	tokens := totalChars / 4
	if tokens < 50 {
		tokens = 50
	}
	return tokens
}

// simulateLatency adds realistic mock latency (150-600ms range).
func simulateLatency() int64 {
	return int64(150 + rand.Intn(450))
}

// priorityLevelFromScore converts a numeric score to a level string.
func priorityLevelFromScore(score int) string {
	switch {
	case score >= 9:
		return "critical"
	case score >= 7:
		return "high"
	case score >= 4:
		return "medium"
	default:
		return "low"
	}
}

// isExternalSender makes a simple heuristic check for external senders.
func isExternalSender(sender string) bool {
	sender = strings.ToLower(sender)
	internalDomains := []string{"@company.com", "@mailpilot.ai", "@internal."}
	for _, d := range internalDomains {
		if strings.Contains(sender, d) {
			return false
		}
	}
	return true
}

func isLikelySelfAuthoredThread(sender string, prefs models.UserPreferences) bool {
	sender = strings.ToLower(strings.TrimSpace(sender))
	if sender == "" {
		return false
	}

	name := strings.ToLower(strings.TrimSpace(prefs.Name))
	if name != "" && (strings.Contains(sender, name) || strings.Contains(name, sender)) {
		return true
	}

	for _, token := range []string{"vatsal", "chaudhary"} {
		if strings.Contains(sender, token) && strings.Contains(name, token) {
			return true
		}
	}

	return false
}
