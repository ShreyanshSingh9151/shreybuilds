package models

import "time"

// ActionRecord stores metadata for a single AI action invocation.
type ActionRecord struct {
	ID               string    `json:"id"`
	Provider         string    `json:"provider"` // "gmail" or "outlook"
	ThreadID         string    `json:"thread_id"`
	Subject          string    `json:"subject"`
	Sender           string    `json:"sender"`
	ActionType       string    `json:"action_type"`
	Category         string    `json:"category,omitempty"`
	SelectedModel    string    `json:"selected_model"`
	RoutedModel      string    `json:"routed_model"`
	ActualModel      string    `json:"actual_model,omitempty"`
	RouteReason      string    `json:"route_reason,omitempty"`
	PriorityReason   string    `json:"priority_reason,omitempty"`
	Confidence       float64   `json:"confidence,omitempty"`
	ActionItemsCount int       `json:"action_items_count"`
	TokensEst        int       `json:"tokens_estimate"`
	CostEst          float64   `json:"cost_estimate"`
	BaselineCostUSD  float64   `json:"baseline_cost_usd"`
	CostSavingsUSD   float64   `json:"cost_savings_usd"`
	LatencyMs        int64     `json:"latency_ms"`
	Timestamp        time.Time `json:"timestamp"`
	ResultPreview    string    `json:"result_preview"`
}

// UserPreferences stores per-user memory preferences.
type UserPreferences struct {
	Name               string    `json:"name"`
	Signature          string    `json:"signature"`
	PreferredTone      string    `json:"preferred_tone"`
	DefaultModel       string    `json:"default_model"`
	ToneForClients     string    `json:"tone_for_clients"`
	ToneForInternal    string    `json:"tone_for_internal"`
	CommonInstructions string    `json:"common_instructions"`
	UpdatedAt          time.Time `json:"updated_at"`
}

// Inbox represents a connected email inbox.
type Inbox struct {
	ID          string `json:"id"`
	Provider    string `json:"provider"`
	Email       string `json:"email"`
	DisplayName string `json:"display_name"`
	Connected   bool   `json:"connected"`
	UnreadCount int    `json:"unread_count"`
}

// RecentEmail represents a recently processed email for demo display.
type RecentEmail struct {
	ID          string    `json:"id"`
	Provider    string    `json:"provider"`
	ThreadID    string    `json:"thread_id"`
	Subject     string    `json:"subject"`
	Sender      string    `json:"sender"`
	Preview     string    `json:"preview"`
	ReceivedAt  time.Time `json:"received_at"`
	IsRead      bool      `json:"is_read"`
	Category    string    `json:"category"`
	Priority    string    `json:"priority"`
	AIProcessed bool      `json:"ai_processed"`
}
