package providers

import (
	"fmt"
	"strings"
)

// MockGPT simulates OpenAI GPT responses with structured, professional, concise style.
type MockGPT struct{}

func (m *MockGPT) Name() string { return "gpt" }

func (m *MockGPT) Summarize(content, tone, length string) (string, error) {
	lines := strings.Split(content, "\n")
	topicHint := extractTopicHint(content)

	switch length {
	case "short":
		return fmt.Sprintf("This thread discusses %s. The sender raises key concerns that require attention. A response addressing the core issue is recommended.", topicHint), nil
	case "long":
		return fmt.Sprintf("**Thread Summary**\n\nThis email thread centers on %s. Across %d message segments, the conversation covers the following points:\n\n1. The sender initially raises the matter with specific context and urgency.\n2. Key stakeholders are referenced, suggesting cross-functional impact.\n3. There is an implicit deadline or expectation for resolution.\n4. The tone suggests professional escalation rather than casual inquiry.\n\n**Recommended Action:** Draft a response acknowledging the concern, provide a timeline, and loop in relevant team members.", topicHint, len(lines)), nil
	default:
		return fmt.Sprintf("This thread is about %s. The sender has outlined specific concerns that need to be addressed. Key points include the urgency of the matter, stakeholder expectations, and a need for a clear resolution timeline. A structured response is advisable.", topicHint), nil
	}
}

func (m *MockGPT) GenerateReply(content, sender, subject, tone, length, signature, instructions string) (string, error) {
	senderName := extractName(sender)
	topicHint := extractTopicHint(content)

	greeting := "Hi " + senderName + ","
	if tone == "formal" {
		greeting = "Dear " + senderName + ","
	}

	body := fmt.Sprintf(`Thank you for reaching out regarding %s. I've reviewed the details you shared, and I want to assure you that we're taking this matter seriously.

Here's what I propose as next steps:

1. I'll coordinate with the relevant team to assess the current status.
2. We'll have an update ready for you within the next 24-48 hours.
3. If there are any interim concerns, please don't hesitate to flag them.`, topicHint)

	if instructions != "" {
		body += "\n\n" + fmt.Sprintf("(Note: Applying your instruction — %s)", instructions)
	}

	if length == "short" {
		body = fmt.Sprintf("Thanks for your email regarding %s. I'm looking into this and will follow up shortly with a detailed response.", topicHint)
	}

	reply := greeting + "\n\n" + body

	if signature != "" {
		reply += "\n\n" + signature
	}

	return reply, nil
}

func (m *MockGPT) Rewrite(content, tone, length string) (string, error) {
	topicHint := extractTopicHint(content)
	switch tone {
	case "formal":
		return fmt.Sprintf("I wish to bring to your attention the matter regarding %s. Upon review of the current context, prompt and structured action is recommended. Please let me know if you would like this aligned with a specific timeline or stakeholder expectation.", topicHint), nil
	case "friendly":
		return fmt.Sprintf("Hey! Just refining my note about %s. I reviewed it and we have a clear way forward. If helpful, I can send a shorter action plan with owners and next steps.", topicHint), nil
	case "casual":
		return fmt.Sprintf("Quick update on %s: I checked it and we can sort this out with a simple plan. Ping me if you want the fast version with immediate next steps.", topicHint), nil
	default:
		return fmt.Sprintf("Thanks for sharing the details on %s. I reviewed the thread and we can resolve this with clear next steps and timeline ownership. If needed, I can also provide a concise reply draft ready to send.", topicHint), nil
	}
}

func (m *MockGPT) Classify(content, subject, sender string) (string, float64, []string, error) {
	subject = strings.ToLower(subject)
	switch {
	case strings.Contains(subject, "invoice") || strings.Contains(subject, "payment"):
		return "finance", 0.92, []string{"invoice", "payment", "accounts"}, nil
	case strings.Contains(subject, "escalation") || strings.Contains(subject, "urgent"):
		return "escalation", 0.95, []string{"urgent", "client-facing", "high-priority"}, nil
	case strings.Contains(subject, "meeting") || strings.Contains(subject, "schedule"):
		return "scheduling", 0.88, []string{"meeting", "calendar", "coordination"}, nil
	case strings.Contains(subject, "update") || strings.Contains(subject, "report"):
		return "status_update", 0.85, []string{"progress", "report", "informational"}, nil
	default:
		return "general", 0.78, []string{"inquiry", "follow-up"}, nil
	}
}

func (m *MockGPT) EstimatePriority(content, subject, sender string) (string, int, string, error) {
	subject = strings.ToLower(subject)
	switch {
	case strings.Contains(subject, "urgent") || strings.Contains(subject, "escalation") || strings.Contains(subject, "critical"):
		return "critical", 9, "Subject indicates urgent escalation. Immediate response recommended to prevent client impact.", nil
	case strings.Contains(subject, "deadline") || strings.Contains(subject, "overdue"):
		return "high", 8, "Time-sensitive matter with approaching or passed deadline. Prioritize within the next few hours.", nil
	case strings.Contains(subject, "review") || strings.Contains(subject, "feedback"):
		return "medium", 5, "Requires review but no immediate urgency. Can be addressed within normal working hours.", nil
	default:
		return "medium", 6, "Standard business communication. Respond within regular SLA timeframe.", nil
	}
}

func (m *MockGPT) ExtractActionItems(content string) ([]string, error) {
	return []string{
		"Review the attached document and provide feedback by EOD",
		"Schedule a follow-up meeting with stakeholders",
		"Update the project timeline based on new requirements",
		"Send confirmation to the client once resolved",
	}, nil
}
