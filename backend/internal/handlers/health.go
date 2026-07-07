package handlers

import (
	"net/http"
	"time"

	"github.com/mailpilot-ai/backend/internal/config"
	"github.com/mailpilot-ai/backend/internal/models"
)

// HealthHandler serves the health check endpoint.
type HealthHandler struct {
	cfg *config.Config
}

// NewHealthHandler creates a HealthHandler.
func NewHealthHandler(cfg *config.Config) *HealthHandler {
	return &HealthHandler{cfg: cfg}
}

// Health responds with service health status.
func (h *HealthHandler) Health(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, models.HealthResponse{
		Status:      "healthy",
		Service:     "mailpilot-ai-backend",
		Version:     "1.0.0",
		Environment: h.cfg.Environment,
		Timestamp:   time.Now(),
	})
}
