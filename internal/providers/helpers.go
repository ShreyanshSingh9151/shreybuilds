package providers

import "strings"

func extractTopicHint(content string) string {
	content = strings.TrimSpace(content)
	if content == "" {
		return "the matter at hand"
	}
	firstLine := strings.SplitN(content, "\n", 2)[0]
	firstLine = strings.TrimSpace(firstLine)
	for _, sep := range []string{". ", "! ", "? "} {
		if idx := strings.Index(firstLine, sep); idx > 0 {
			firstLine = firstLine[:idx]
			break
		}
	}
	if len(firstLine) > 60 {
		firstLine = firstLine[:57] + "..."
	}
	return firstLine
}

func buildClassifyPrompt(content, subject, sender string) string {
	return `You are an email classification assistant. Analyze the following email and classify it.

Subject: ` + subject + `
Sender: ` + sender + `
Content:
` + content + `

Respond in JSON:
{
  "category": "one of: urgent, important, follow_up, newsletter, spam, internal, client, personal",
  "confidence": <0.0 to 1.0>,
  "labels": ["relevant", "labels", "here"]
}`
}

func buildPriorityPrompt(content, subject, sender string) string {
	return `You are an email priority assessment assistant. Analyze the following email and estimate its priority.

Subject: ` + subject + `
Sender: ` + sender + `
Content:
` + content + `

Respond in JSON:
{
  "level": "one of: high, medium, low",
  "score": <0 to 100>,
  "reason": "brief explanation"
}`
}

func buildActionItemsPrompt(content string) string {
	return `Extract actionable items from the following email content. Return as a JSON array of strings.

Content:
` + content + `

Respond as JSON:
["action item 1", "action item 2", ...]`
}

func buildSummarizePrompt(content, tone, length string) string {
	tonePart := ""
	if tone != "" {
		tonePart = " Use a " + tone + " tone."
	}
	lengthPart := ""
	if length != "" {
		lengthPart = " Keep it " + length + "."
	}
	return `Summarize the following email content.` + tonePart + lengthPart + `

Content:
` + content + `

Provide a concise summary.`
}

func buildReplyPrompt(content, sender, subject, tone, length, signature, instructions string) string {
	var b strings.Builder
	b.WriteString("You are an email reply assistant. Write a professional reply to the following email.\n\n")
	if instructions != "" {
		b.WriteString("Special instructions: " + instructions + "\n\n")
	}
	if tone != "" {
		b.WriteString("Tone: " + tone + "\n")
	}
	if length != "" {
		b.WriteString("Length: " + length + "\n")
	}
	b.WriteString("\nOriginal Email:\nSubject: " + subject + "\nFrom: " + sender + "\n\n" + content + "\n\n")
	if signature != "" {
		b.WriteString("\nSign the email with:\n" + signature + "\n")
	}
	b.WriteString("\nWrite only the reply body, no subject line.")
	return b.String()
}

func buildRewritePrompt(content, tone, length string) string {
	tonePart := ""
	if tone != "" {
		tonePart = "Rewrite it in a " + tone + " tone."
	}
	lengthPart := ""
	if length != "" {
		lengthPart = " Make it " + length + "."
	}
	return `Rewrite the following email content.` + tonePart + lengthPart + `

Original:
` + content + `

Provide only the rewritten content.`
}
