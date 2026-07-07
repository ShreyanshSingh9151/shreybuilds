package config

import (
	"os"
	"strconv"
)

// Config holds all application configuration loaded from environment variables.
type Config struct {
	Port        string
	Environment string

	// CORS
	AllowedOrigins []string

	// OpenRouter / OpenAI-compatible config (empty key means use mock providers)
	OpenRouterAPIKey      string
	OpenRouterBaseURL     string
	OpenRouterModelGPT    string
	OpenRouterModelClaude string
	OpenRouterModelGemini string

	// Backward-compatible aliases
	OpenAIKey     string
	OpenAIBaseURL string
	OpenAIModel   string

	// Optional direct provider compatibility (kept for fallback behavior)
	ClaudeKey string
	GeminiKey string

	// Cost rates per 1K tokens (USD)
	GPTCostPer1K    float64
	ClaudeCostPer1K float64
	GeminiCostPer1K float64
}

// Load reads configuration from environment variables with sensible defaults.
func Load() *Config {
	openAIModel := envOrDefault("OPENAI_MODEL", "meta-llama/llama-3.2-3b-instruct:free")
	openRouterBaseURL := envOrDefault("OPENROUTER_BASE_URL", envOrDefault("OPENAI_BASE_URL", "https://openrouter.ai/api/v1"))
	openRouterKey := envOrDefault("OPENROUTER_API_KEY", os.Getenv("OPENAI_API_KEY"))
	openRouterModelGPT := envOrDefault("OPENROUTER_MODEL_GPT", openAIModel)
	openRouterModelClaude := envOrDefault("OPENROUTER_MODEL_CLAUDE", openRouterModelGPT)
	openRouterModelGemini := envOrDefault("OPENROUTER_MODEL_GEMINI", openRouterModelGPT)

	return &Config{
		Port:        envOrDefault("PORT", "8080"),
		Environment: envOrDefault("ENVIRONMENT", "development"),

		AllowedOrigins: []string{
			envOrDefault("CORS_ORIGIN_DASHBOARD", "http://localhost:3000"),
			envOrDefault("CORS_ORIGIN_EXTENSION", "chrome-extension://*"),
			"http://localhost:5173",
			"http://localhost:5174",
		},

		OpenRouterAPIKey:      openRouterKey,
		OpenRouterBaseURL:     openRouterBaseURL,
		OpenRouterModelGPT:    openRouterModelGPT,
		OpenRouterModelClaude: openRouterModelClaude,
		OpenRouterModelGemini: openRouterModelGemini,

		OpenAIKey:     os.Getenv("OPENAI_API_KEY"),
		OpenAIBaseURL: envOrDefault("OPENAI_BASE_URL", "https://openrouter.ai/api/v1"),
		OpenAIModel:   openAIModel,
		ClaudeKey:     os.Getenv("CLAUDE_API_KEY"),
		GeminiKey:     os.Getenv("GEMINI_API_KEY"),

		GPTCostPer1K:    envOrDefaultFloat("GPT_COST_PER_1K", 0.03),
		ClaudeCostPer1K: envOrDefaultFloat("CLAUDE_COST_PER_1K", 0.025),
		GeminiCostPer1K: envOrDefaultFloat("GEMINI_COST_PER_1K", 0.001),
	}
}

// HasRealProvider returns true if at least one real LLM API key is configured.
func (c *Config) HasRealProvider(model string) bool {
	switch model {
	case "gpt":
		return c.OpenRouterAPIKey != "" || c.OpenAIKey != ""
	case "claude":
		return c.OpenRouterAPIKey != "" || c.ClaudeKey != ""
	case "gemini":
		return c.OpenRouterAPIKey != "" || c.GeminiKey != ""
	default:
		return false
	}
}

func envOrDefault(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func envOrDefaultFloat(key string, fallback float64) float64 {
	if v := os.Getenv(key); v != "" {
		if f, err := strconv.ParseFloat(v, 64); err == nil {
			return f
		}
	}
	return fallback
}
