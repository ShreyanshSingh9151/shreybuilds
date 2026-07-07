package models

// DashboardSummary is the aggregated view for the dashboard.
type DashboardSummary struct {
	ConnectedInboxes int            `json:"connected_inboxes"`
	UnreadCount      int            `json:"unread_count"`
	PendingReplies   int            `json:"pending_replies"`
	TotalAIActions   int            `json:"total_ai_actions"`
	TotalTokens      int            `json:"total_tokens"`
	TotalCostUSD     float64        `json:"total_cost_usd"`
	BaselineCostUSD  float64        `json:"baseline_cost_usd"`
	CostSavingsUSD   float64        `json:"cost_savings_usd"`
	AvgLatencyMs     float64        `json:"avg_latency_ms"`
	ModelUsage       map[string]int `json:"model_usage"`
	ActionUsage      map[string]int `json:"action_usage"`
	CategoryCounts   map[string]int `json:"category_counts"`
}

// CostBreakdown provides per-model cost analytics.
type CostBreakdown struct {
	TotalCostUSD float64              `json:"total_cost_usd"`
	TotalTokens  int                  `json:"total_tokens"`
	PerModel     map[string]ModelCost `json:"per_model"`
}

// ModelCost holds cost data for a single model.
type ModelCost struct {
	Model       string  `json:"model"`
	Tokens      int     `json:"tokens"`
	CostUSD     float64 `json:"cost_usd"`
	Invocations int     `json:"invocations"`
}

// ModelUsageSummary provides model routing analytics.
type ModelUsageSummary struct {
	Models []ModelUsageEntry `json:"models"`
}

// ModelUsageEntry is a single model's usage stats.
type ModelUsageEntry struct {
	Model       string  `json:"model"`
	Invocations int     `json:"invocations"`
	Tokens      int     `json:"tokens"`
	CostUSD     float64 `json:"cost_usd"`
	Percentage  float64 `json:"percentage"`
}
