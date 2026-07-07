package handlers

import (
	"net/http"

	"github.com/mailpilot-ai/backend/internal/models"
	"github.com/mailpilot-ai/backend/internal/services"
)

// MemoryHandler handles user preference endpoints.
type MemoryHandler struct {
	memory *services.MemoryService
}

// NewMemoryHandler creates a MemoryHandler.
func NewMemoryHandler(memory *services.MemoryService) *MemoryHandler {
	return &MemoryHandler{memory: memory}
}

// GetPreferences handles GET /api/v1/memory
func (h *MemoryHandler) GetPreferences(w http.ResponseWriter, r *http.Request) {
	prefs := h.memory.GetPreferences()
	writeJSON(w, http.StatusOK, models.APIResponse{
		Success: true,
		Data:    prefs,
	})
}

// UpdatePreferences handles POST /api/v1/memory/preferences
func (h *MemoryHandler) UpdatePreferences(w http.ResponseWriter, r *http.Request) {
	var req models.MemoryPreferencesRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body: "+err.Error())
		return
	}

	updated := h.memory.UpdatePreferences(req)
	writeJSON(w, http.StatusOK, models.APIResponse{
		Success: true,
		Data:    updated,
	})
}
