package router

import (
	"github.com/go-chi/chi/v5"

	"github.com/mailpilot-ai/backend/internal/config"
	"github.com/mailpilot-ai/backend/internal/handlers"
	"github.com/mailpilot-ai/backend/internal/middleware"
)

// New creates and configures the main chi router with all routes and middleware.
func New(
	cfg *config.Config,
	healthH *handlers.HealthHandler,
	emailAIH *handlers.EmailAIHandler,
	memoryH *handlers.MemoryHandler,
	dashboardH *handlers.DashboardHandler,
	inboxH *handlers.InboxHandler,
) *chi.Mux {
	r := chi.NewRouter()

	// Global middleware
	corsHandler := middleware.NewCORS(cfg.AllowedOrigins)
	r.Use(corsHandler.Handler)
	r.Use(middleware.RequestLogger)

	// Health check
	r.Get("/health", healthH.Health)

	// API v1 routes
	r.Route("/api/v1", func(r chi.Router) {
		// AI actions
		r.Route("/threads", func(r chi.Router) {
			r.Post("/summarize", emailAIH.Summarize)
			r.Post("/reply", emailAIH.Reply)
			r.Post("/rewrite", emailAIH.Rewrite)
			r.Post("/classify", emailAIH.Classify)
		})

		// Memory / preferences
		r.Get("/memory", memoryH.GetPreferences)
		r.Post("/memory/preferences", memoryH.UpdatePreferences)

		// Dashboard analytics
		r.Route("/dashboard", func(r chi.Router) {
			r.Get("/summary", dashboardH.Summary)
			r.Get("/actions", dashboardH.Actions)
			r.Get("/costs", dashboardH.Costs)
			r.Get("/models", dashboardH.Models)
		})

		// Demo inbox
		r.Get("/inboxes", inboxH.GetInboxes)
		r.Get("/emails/recent", inboxH.GetRecentEmails)
	})

	return r
}
