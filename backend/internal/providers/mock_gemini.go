package providers

import (
	"fmt"
	"strings"
)

// MockGemini simulates Google Gemini responses with productivity-oriented, structured style.
type MockGemini struct{}

func (m *MockGemini) Name() string { return "gemini" }

func (m *MockGemini) Summarize(content, tone, length string) (string, error) {
	topicHint := extractTopicHint(content)

	return fmt.Sprintf(`📋 **Quick Summary**
• Topic: %s
• Status: Requires attention
• Suggested action: Review and respond within SLA

📊 **Thread Analysis**
- Messages analyzed: based on content structure
- Sentiment: Professional/Neutral
- Urgency indicators: Moderate
- Key entities mentioned: Sender, referenced stakeholders`, topicHint), nil
}

func (m *MockGemini) GenerateReply(content, sender, subject, tone, length, signature, instructions string) (string, error) {
	senderName := extractName(sender)
	topicHint := extractTopicHint(content)

	reply := fmt.Sprintf(`Hi %s,

Thanks for your email about %s. Here's a quick update from my side:

✅ Received and reviewed your message
📋 Next steps have been identified
⏰ Expected turnaround: 24-48 hours

I'll keep you posted on progress. Let me know if priorities change on your end.`, senderName, topicHint)

	if instructions != "" {
		reply += fmt.Sprintf("\n\n[User instruction applied: %s]", instructions)
	}

	if signature != "" {
		reply += "\n\n" + signature
	}

	return reply, nil
}

func (m *MockGemini) Rewrite(content, tone, length string) (string, error) {
	switch tone {
	case "formal":
		return "Please be advised that I have reviewed the matter in question. Based on my assessment, the following course of action is recommended. I shall proceed accordingly unless otherwise directed. Your prompt attention to this matter would be appreciated.", nil
	case "friendly":
		return "Hey! Just had a look at this and I think we're in good shape. Here's what I'm thinking we should do next — let me know if this works for you! Always happy to adjust the approach.", nil
	case "casual":
		return "Looked into this — pretty straightforward. Here's the plan. Let me know if anything needs tweaking!", nil
	default:
		return "I've reviewed the details and have a clear path forward. Here are the recommended next steps, organized by priority. Please review and confirm so we can proceed efficiently.", nil
	}
}

func (m *MockGemini) Classify(content, subject, sender string) (string, float64, []string, error) {
	subject = strings.ToLower(subject)
	content = strings.ToLower(content)

	// Gemini-style: more granular, productivity-oriented classification
	switch {
	case strings.Contains(subject, "invoice") || strings.Contains(content, "payment") || strings.Contains(content, "billing"):
		return "finance_operations", 0.93, []string{"invoice", "payment-processing", "accounts", "action-required"}, nil
	case strings.Contains(subject, "escalation") || strings.Contains(subject, "urgent") || strings.Contains(content, "asap"):
		return "critical_escalation", 0.96, []string{"urgent", "escalation", "client-impact", "sla-risk"}, nil
	case strings.Contains(subject, "meeting") || strings.Contains(content, "calendar") || strings.Contains(content, "schedule"):
		return "calendar_coordination", 0.90, []string{"meeting", "scheduling", "availability", "coordination"}, nil
	case strings.Contains(subject, "update") || strings.Contains(subject, "status") || strings.Contains(subject, "report"):
		return "status_report", 0.87, []string{"progress-update", "reporting", "informational", "no-action-needed"}, nil
	case strings.Contains(subject, "feedback") || strings.Contains(subject, "review"):
		return "review_request", 0.84, []string{"feedback", "review", "approval-needed"}, nil
	default:
		return "general_inquiry", 0.75, []string{"inquiry", "information-request", "routine"}, nil
	}
}

func (m *MockGemini) EstimatePriority(content, subject, sender string) (string, int, string, error) {
	subject = strings.ToLower(subject)
	switch {
	case strings.Contains(subject, "urgent") || strings.Contains(subject, "critical") || strings.Contains(subject, "escalation"):
		return "critical", 10, "🔴 Critical: Urgency markers detected in subject. Immediate triage recommended. Estimated impact: High.", nil
	case strings.Contains(subject, "deadline") || strings.Contains(subject, "due today"):
		return "high", 8, "🟠 High: Time-sensitive with clear deadline. Schedule response within next 2 hours.", nil
	case strings.Contains(subject, "review") || strings.Contains(subject, "feedback"):
		return "medium", 5, "🟡 Medium: Requires attention but no hard deadline. Queue for next available slot.", nil
	case strings.Contains(subject, "fyi") || strings.Contains(subject, "newsletter"):
		return "low", 2, "🟢 Low: Informational only. No action required. Archive after reading.", nil
	default:
		return "medium", 6, "🟡 Medium: Standard business email. Respond within normal SLA (4-8 hours).", nil
	}
}

func (m *MockGemini) ExtractActionItems(content string) ([]string, error) {
	return []string{
		"[P1] Respond to sender's primary request within SLA",
		"[P2] Review attached documents or referenced materials",
		"[P2] Coordinate with mentioned team members or departments",
		"[P3] Update tracking system with email status and next steps",
	}, nil
}
