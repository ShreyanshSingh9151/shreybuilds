package services

import (
	"github.com/mailpilot-ai/backend/internal/models"
	"github.com/mailpilot-ai/backend/internal/store"
)

// AnalyticsService computes dashboard metrics from stored action records.
type AnalyticsService struct {
	actionStore *store.ActionStore
	inboxStore  *store.InboxStore
}

// NewAnalyticsService creates an AnalyticsService.
func NewAnalyticsService(actionStore *store.ActionStore, inboxStore *store.InboxStore) *AnalyticsService {
	return &AnalyticsService{
		actionStore: actionStore,
		inboxStore:  inboxStore,
	}
}

// Summary computes the full dashboard summary.
func (s *AnalyticsService) Summary() models.DashboardSummary {
	records := s.actionStore.All()

	totalTokens := 0
	totalCost := 0.0
	totalBaseline := 0.0
	totalSavings := 0.0
	totalLatency := int64(0)
	modelUsage := make(map[string]int)
	actionUsage := make(map[string]int)
	categoryMap := make(map[string]int)

	for _, r := range records {
		totalTokens += r.TokensEst
		totalCost += r.CostEst
		totalBaseline += r.BaselineCostUSD
		totalSavings += r.CostSavingsUSD
		totalLatency += r.LatencyMs
		modelUsage[r.RoutedModel]++
		actionUsage[r.ActionType]++

		if r.ActionType == "classify" {
			category := r.Category
			if category == "" {
				category = "unknown"
			}
			categoryMap[category]++
		}
	}

	// If no classify actions, provide some default counts
	if len(categoryMap) == 0 {
		categoryMap["general"] = 0
		categoryMap["escalation"] = 0
		categoryMap["finance"] = 0
	}

	avgLatency := 0.0
	if len(records) > 0 {
		avgLatency = float64(totalLatency) / float64(len(records))
	}

	return models.DashboardSummary{
		ConnectedInboxes: s.inboxStore.ConnectedCount(),
		UnreadCount:      s.inboxStore.TotalUnread(),
		PendingReplies:   estimatePendingReplies(records),
		TotalAIActions:   len(records),
		TotalTokens:      totalTokens,
		TotalCostUSD:     roundTo4(totalCost),
		BaselineCostUSD:  roundTo4(totalBaseline),
		CostSavingsUSD:   roundTo4(totalSavings),
		AvgLatencyMs:     roundTo2(avgLatency),
		ModelUsage:       modelUsage,
		ActionUsage:      actionUsage,
		CategoryCounts:   categoryMap,
	}
}

// RecentActions returns the most recent action records.
func (s *AnalyticsService) RecentActions(limit int) []models.ActionRecord {
	if limit <= 0 {
		limit = 20
	}
	return s.actionStore.Recent(limit)
}

// CostBreakdown returns per-model cost analytics.
func (s *AnalyticsService) CostBreakdown() models.CostBreakdown {
	records := s.actionStore.All()

	perModel := make(map[string]*models.ModelCost)
	totalTokens := 0
	totalCost := 0.0

	for _, r := range records {
		totalTokens += r.TokensEst
		totalCost += r.CostEst

		mc, ok := perModel[r.RoutedModel]
		if !ok {
			mc = &models.ModelCost{Model: r.RoutedModel}
			perModel[r.RoutedModel] = mc
		}
		mc.Tokens += r.TokensEst
		mc.CostUSD += r.CostEst
		mc.Invocations++
	}

	result := make(map[string]models.ModelCost)
	for k, v := range perModel {
		v.CostUSD = roundTo4(v.CostUSD)
		result[k] = *v
	}

	return models.CostBreakdown{
		TotalCostUSD: roundTo4(totalCost),
		TotalTokens:  totalTokens,
		PerModel:     result,
	}
}

// ModelUsage returns model routing analytics.
func (s *AnalyticsService) ModelUsage() models.ModelUsageSummary {
	records := s.actionStore.All()

	type modelAcc struct {
		invocations int
		tokens      int
		cost        float64
	}
	acc := make(map[string]*modelAcc)
	total := len(records)

	for _, r := range records {
		ma, ok := acc[r.RoutedModel]
		if !ok {
			ma = &modelAcc{}
			acc[r.RoutedModel] = ma
		}
		ma.invocations++
		ma.tokens += r.TokensEst
		ma.cost += r.CostEst
	}

	entries := make([]models.ModelUsageEntry, 0, len(acc))
	for model, ma := range acc {
		pct := 0.0
		if total > 0 {
			pct = roundTo2(float64(ma.invocations) / float64(total) * 100)
		}
		entries = append(entries, models.ModelUsageEntry{
			Model:       model,
			Invocations: ma.invocations,
			Tokens:      ma.tokens,
			CostUSD:     roundTo4(ma.cost),
			Percentage:  pct,
		})
	}

	return models.ModelUsageSummary{Models: entries}
}

// estimatePendingReplies heuristically counts threads that were summarized/classified but not replied to.
func estimatePendingReplies(records []models.ActionRecord) int {
	threadActions := make(map[string]map[string]bool)
	for _, r := range records {
		if _, ok := threadActions[r.ThreadID]; !ok {
			threadActions[r.ThreadID] = make(map[string]bool)
		}
		threadActions[r.ThreadID][r.ActionType] = true
	}

	pending := 0
	for _, actions := range threadActions {
		if !actions["reply"] && (actions["summarize"] || actions["classify"]) {
			pending++
		}
	}
	return pending
}

func roundTo2(f float64) float64 {
	return float64(int(f*100)) / 100
}

func roundTo4(f float64) float64 {
	return float64(int(f*10000)) / 10000
}
