package providers

import (
	"fmt"
	"strings"
)

// MockClaude simulates Anthropic Claude responses with nuanced, long-context style.
type MockClaude struct{}

func (m *MockClaude) Name() string { return "claude" }

func (m *MockClaude) Summarize(content, tone, length string) (string, error) {
	topicHint := extractTopicHint(content)
	wordCount := len(strings.Fields(content))

	base := fmt.Sprintf(`Here's my analysis of this email thread regarding %s:

**Context & Background**
The conversation spans approximately %d words and involves what appears to be an ongoing professional exchange. The sender is raising a matter that carries both operational and relational significance.

**Key Themes**
- There is a clear request or concern that requires acknowledgment
- The tone suggests this has been discussed before or has built-up context
- Implicit expectations around timeline and accountability are present

**Nuances Worth Noting**
The sender's phrasing suggests they value transparency and responsiveness. Any reply should demonstrate that their concern has been genuinely understood, not just acknowledged superficially.

**Suggested Response Strategy**
Lead with empathy, follow with specifics, and close with a concrete next step and timeline.`, topicHint, wordCount)

	if length == "short" {
		return fmt.Sprintf("This thread discusses %s. The sender raises concerns with implicit urgency and expects a substantive, empathetic response with concrete next steps.", topicHint), nil
	}

	return base, nil
}

func (m *MockClaude) GenerateReply(content, sender, subject, tone, length, signature, instructions string) (string, error) {
	senderName := extractName(sender)
	topicHint := extractTopicHint(content)

	reply := fmt.Sprintf(`Hi %s,

Thank you for sharing this with me. I want to make sure I'm fully understanding your perspective on %s before I respond in detail.

From what I gather, there are a few interconnected concerns here:
- The immediate issue you've raised, which I take seriously
- The broader context of how this fits into our ongoing work together
- Your expectation (which is entirely reasonable) for a clear path forward

Here's what I'd like to propose: let me take a closer look at the specifics you've mentioned, consult with the relevant people on my end, and come back to you with a thorough response. I'd rather give you something substantive than a hasty reply.

Would it work for you if I followed up by end of day tomorrow? If there's anything more urgent that can't wait, please let me know and I'll prioritize accordingly.`, senderName, topicHint)

	if instructions != "" {
		reply += fmt.Sprintf("\n\n[Applying preference: %s]", instructions)
	}

	if signature != "" {
		reply += "\n\n" + signature
	}

	return reply, nil
}

func (m *MockClaude) Rewrite(content, tone, length string) (string, error) {
	switch tone {
	case "formal":
		return "I am writing to address the matter you have raised. Having carefully considered the various dimensions of this issue, I believe it warrants a thoughtful and measured approach. I would value the opportunity to discuss this further at a time that is convenient for you, so that we may arrive at a resolution that addresses all stakeholders' concerns.", nil
	case "friendly":
		return "Thanks for bringing this up! I've given it some thought, and I think there's a really good path forward here. What I appreciate about your approach is that you've clearly thought this through too. Let's find some time to connect and work through the details together — I'm optimistic we can land in a great place.", nil
	case "casual":
		return "Got it — makes total sense. I've been thinking about this too, and I reckon we're actually pretty close to being on the same page. Want to grab a quick coffee chat about it? Sometimes these things are easier to sort out in person.", nil
	default:
		return "Thank you for raising this matter. I've taken the time to consider the full context of what you've shared, and I want to respond in a way that genuinely addresses your concerns. I believe we can find a resolution that works well for everyone involved. Let me outline a few thoughts and suggested next steps for your consideration.", nil
	}
}

func (m *MockClaude) Classify(content, subject, sender string) (string, float64, []string, error) {
	subject = strings.ToLower(subject)
	switch {
	case strings.Contains(subject, "invoice") || strings.Contains(subject, "payment") || strings.Contains(subject, "billing"):
		return "finance", 0.91, []string{"billing", "accounts-receivable", "financial-operations"}, nil
	case strings.Contains(subject, "escalation") || strings.Contains(subject, "complaint"):
		return "escalation", 0.94, []string{"client-relations", "service-recovery", "high-touch"}, nil
	case strings.Contains(subject, "proposal") || strings.Contains(subject, "contract"):
		return "business_development", 0.87, []string{"sales", "proposals", "commercial"}, nil
	default:
		return "general_correspondence", 0.76, []string{"informational", "routine", "follow-up"}, nil
	}
}

func (m *MockClaude) EstimatePriority(content, subject, sender string) (string, int, string, error) {
	subject = strings.ToLower(subject)
	switch {
	case strings.Contains(subject, "urgent") || strings.Contains(subject, "critical") || strings.Contains(subject, "escalation"):
		return "critical", 9, "This communication carries markers of urgency — both in subject line and likely in the sender's expectations. The relational cost of delayed response here could be significant.", nil
	case strings.Contains(subject, "deadline") || strings.Contains(subject, "due") || strings.Contains(subject, "overdue"):
		return "high", 7, "Time-bound request with clear expectations. While not an emergency, delayed response could affect project timelines and trust.", nil
	default:
		return "medium", 5, "Standard professional correspondence. Important to respond thoughtfully but no indicators of time-critical urgency.", nil
	}
}

func (m *MockClaude) ExtractActionItems(content string) ([]string, error) {
	return []string{
		"Acknowledge the sender's core concern with a specific, empathetic response",
		"Review the referenced materials or prior context before responding in full",
		"Identify and consult with internal stakeholders who may need to weigh in",
		"Propose a concrete timeline for resolution and communicate it to the sender",
		"Set a personal reminder to follow up if no response is received within 48 hours",
	}, nil
}
