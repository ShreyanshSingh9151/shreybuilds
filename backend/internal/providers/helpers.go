package providers

import "strings"

// extractTopicHint pulls a rough topic from email content for realistic mock output.
func extractTopicHint(content string) string {
	content = strings.TrimSpace(content)
	if content == "" {
		return "the matter at hand"
	}

	// Use the first sentence or first 80 chars as a hint
	firstLine := strings.SplitN(content, "\n", 2)[0]
	firstLine = strings.TrimSpace(firstLine)

	// Try to find first sentence
	for _, sep := range []string{". ", "! ", "? "} {
		if idx := strings.Index(firstLine, sep); idx > 0 && idx < 120 {
			return strings.ToLower(strings.TrimSpace(firstLine[:idx]))
		}
	}

	if len(firstLine) > 80 {
		firstLine = firstLine[:80] + "..."
	}

	if firstLine == "" {
		return "the matter discussed in this thread"
	}

	return strings.ToLower(firstLine)
}

// extractName attempts to pull a human name from an email address.
func extractName(email string) string {
	email = strings.TrimSpace(email)
	if email == "" {
		return "there"
	}

	// If it contains a display name like "John Doe <john@example.com>"
	if idx := strings.Index(email, "<"); idx > 0 {
		name := strings.TrimSpace(email[:idx])
		name = strings.Trim(name, "\"'")
		if name != "" {
			return name
		}
	}

	// Extract from email local part
	parts := strings.SplitN(email, "@", 2)
	local := parts[0]

	// Replace common separators with space and title-case
	local = strings.NewReplacer(".", " ", "_", " ", "-", " ").Replace(local)
	words := strings.Fields(local)
	for i, w := range words {
		if len(w) > 0 {
			words[i] = strings.ToUpper(w[:1]) + w[1:]
		}
	}

	return strings.Join(words, " ")
}
