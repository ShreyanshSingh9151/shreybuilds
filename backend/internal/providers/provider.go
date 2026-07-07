package providers

// LLMProvider defines the interface every language model provider must implement.
// This abstraction allows swapping mock providers for real API clients without
// changing any business logic.
type LLMProvider interface {
	// Name returns the provider identifier (e.g., "gpt", "claude", "gemini").
	Name() string

	// Summarize produces a summary of the given email content.
	Summarize(content, tone, length string) (string, error)

	// GenerateReply produces a reply draft for the given email.
	GenerateReply(content, sender, subject, tone, length, signature, instructions string) (string, error)

	// Rewrite rewrites the content with the specified tone.
	Rewrite(content, tone, length string) (string, error)

	// Classify categorizes the email and returns category, confidence, and labels.
	Classify(content, subject, sender string) (category string, confidence float64, labels []string, err error)

	// EstimatePriority returns priority level, score (1-10), and reasoning.
	EstimatePriority(content, subject, sender string) (level string, score int, reason string, err error)

	// ExtractActionItems pulls actionable items from email content.
	ExtractActionItems(content string) ([]string, error)
}
