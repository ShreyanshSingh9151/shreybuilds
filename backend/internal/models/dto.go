package models

import "time"

// --- Request DTOs ---

// AIActionRequest is the unified request body for all AI email actions.
type AIActionRequest struct {
	Provider      string `json:"provider"` // "gmail" or "outlook"
	ThreadID      string `json:"thread_id"`
	Subject       string `json:"subject"`
	Sender        string `json:"sender"`
	Content       string `json:"content"`
	SelectedModel string `json:"selected_model"`   // "gpt", "claude", "gemini", "auto"
	Tone          string `json:"tone,omitempty"`   // "professional", "friendly", "formal", "casual"
	Length        string `json:"length,omitempty"` // "short", "medium", "long"
}

// MemoryPreferencesRequest holds user preference updates.
type MemoryPreferencesRequest struct {
	Name               string `json:"name,omitempty"`
	Signature          string `json:"signature,omitempty"`
	PreferredTone      string `json:"preferred_tone,omitempty"`
	DefaultModel       string `json:"default_model,omitempty"`
	ToneForClients     string `json:"tone_for_clients,omitempty"`
	ToneForInternal    string `json:"tone_for_internal,omitempty"`
	CommonInstructions string `json:"common_instructions,omitempty"`
}

// --- Response DTOs ---

// AIActionResponse is returned by all AI action endpoints.
type AIActionResponse struct {
	Success          bool            `json:"success"`
	ActionType       string          `json:"action_type"`
	SelectedModel    string          `json:"selected_model"`
	RoutedModel      string          `json:"routed_model"`
	ActualModel      string          `json:"actual_model,omitempty"`
	RouteReason      string          `json:"route_reason,omitempty"`
	PriorityReason   string          `json:"priority_reason,omitempty"`
	Confidence       float64         `json:"confidence,omitempty"`
	ActionItemsCount int             `json:"action_items_count"`
	Output           string          `json:"output"`
	Summary          string          `json:"summary,omitempty"`
	Classification   *Classification `json:"classification,omitempty"`
	Priority         *Priority       `json:"priority,omitempty"`
	ActionItems      []string        `json:"action_items,omitempty"`
	TokensEstimate   int             `json:"tokens_estimate"`
	CostEstimate     float64         `json:"cost_estimate"`
	BaselineCostUSD  float64         `json:"baseline_cost_usd"`
	CostSavingsUSD   float64         `json:"cost_savings_usd"`
	LatencyMs        int64           `json:"latency_ms"`
	Timestamp        time.Time       `json:"timestamp"`
}

// Classification holds email classification results.
type Classification struct {
	Category   string   `json:"category"`
	Confidence float64  `json:"confidence"`
	Labels     []string `json:"labels"`
}

// Priority holds email priority estimation.
type Priority struct {
	Level  string `json:"level"` // "critical", "high", "medium", "low"
	Score  int    `json:"score"` // 1-10
	Reason string `json:"reason"`
}

// HealthResponse is returned by the health check endpoint.
type HealthResponse struct {
	Status      string    `json:"status"`
	Service     string    `json:"service"`
	Version     string    `json:"version"`
	Environment string    `json:"environment"`
	Timestamp   time.Time `json:"timestamp"`
}

// APIResponse wraps any response with a standard envelope.
type APIResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}
