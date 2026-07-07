package handlers

import (
	"net/http"
	"strconv"

	"github.com/mailpilot-ai/backend/internal/models"
	"github.com/mailpilot-ai/backend/internal/services"
)

// DashboardHandler handles dashboard analytics endpoints.
type DashboardHandler struct {
	analytics *services.AnalyticsService
}

// NewDashboardHandler creates a DashboardHandler.
func NewDashboardHandler(analytics *services.AnalyticsService) *DashboardHandler {
	return &DashboardHandler{analytics: analytics}
}

// Summary handles GET /api/v1/dashboard/summary
func (h *DashboardHandler) Summary(w http.ResponseWriter, r *http.Request) {
	summary := h.analytics.Summary()
	writeJSON(w, http.StatusOK, models.APIResponse{
		Success: true,
		Data:    summary,
	})
}

// Actions handles GET /api/v1/dashboard/actions
func (h *DashboardHandler) Actions(w http.ResponseWriter, r *http.Request) {
	limit := 20
	if l := r.URL.Query().Get("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 {
			limit = parsed
		}
	}

	actions := h.analytics.RecentActions(limit)
	writeJSON(w, http.StatusOK, models.APIResponse{
		Success: true,
		Data:    actions,
	})
}

// Costs handles GET /api/v1/dashboard/costs
func (h *DashboardHandler) Costs(w http.ResponseWriter, r *http.Request) {
	costs := h.analytics.CostBreakdown()
	writeJSON(w, http.StatusOK, models.APIResponse{
		Success: true,
		Data:    costs,
	})
}

// Models handles GET /api/v1/dashboard/models
func (h *DashboardHandler) Models(w http.ResponseWriter, r *http.Request) {
	usage := h.analytics.ModelUsage()
	writeJSON(w, http.StatusOK, models.APIResponse{
		Success: true,
		Data:    usage,
	})
}
