# MailPilot AI Gmail Extension

Demo Chrome extension for Gmail built with Manifest V3. It watches Gmail's single-page navigation, extracts visible thread data from the DOM, and sends that payload to the MailPilot AI Go backend.

## File structure

```text
extension/
├── README.md
├── background.js
├── content.js
├── manifest.json
├── options.css
├── options.html
├── options.js
└── styles.css
```

## What it does

- Detects when Gmail is showing a thread view.
- Extracts the visible thread subject, sender, message text, and a best-effort thread ID.
- Renders a floating MailPilot AI panel inside Gmail.
- Sends requests to these backend endpoints:
  - `POST /api/v1/threads/summarize`
  - `POST /api/v1/threads/reply`
  - `POST /api/v1/threads/rewrite`
  - `POST /api/v1/threads/classify`
  - `POST /api/v1/memory/preferences`
- Displays summary, generated output, classification, priority, routed model, cost, and latency.
- Supports copy-to-clipboard and a best-effort insert-into-compose flow.

## Setup steps

1. Start the backend so `http://localhost:8080` is available, or choose another base URL.
2. Open Chrome and go to `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select the `extension/` folder.
6. Open the extension's **Details** page, then open **Extension options** if you want to change the backend URL.
7. Open Gmail at `https://mail.google.com/` and click into a thread.

## Backend payload sent from Gmail

```json
{
  "provider": "gmail",
  "thread_id": "thread_123",
  "subject": "Extracted subject",
  "sender": "Extracted sender",
  "content": "Extracted email thread text",
  "selected_model": "auto",
  "tone": "professional",
  "length": "medium"
}
```

## Gmail DOM assumptions and fallback logic

The extraction logic is intentionally conservative and demo-focused:

- **Thread view detection**: looks for visible Gmail message body nodes inside `div[role="main"]`, mainly `div.a3s.aiL` and `div.a3s`.
- **Subject extraction**: tries `h2[data-thread-perm-id]`, then `h2.hP`, then any thread header `h2` inside Gmail main content.
- **Sender extraction**: looks for visible sender nodes such as `span[email].gD` and related email-address elements.
- **Thread body extraction**: concatenates the visible text from all message body blocks currently rendered in the thread.
- **Thread ID extraction**:
  - first tries the current Gmail hash route,
  - then `data-thread-perm-id`,
  - otherwise creates a deterministic fallback ID from subject, sender, and content.
- **Compose insertion**: tries to locate a visible Gmail compose textbox and insert the generated output. If Gmail's DOM structure does not match, users can still rely on Copy.

## Limitations

- Gmail DOM classes can change, so selectors may need updates over time.
- Only visible message content is extracted; collapsed or unloaded parts of long threads may be missed.
- Insert-into-compose is best effort and less reliable than copy-to-clipboard.
- This extension does not use the Gmail API, does not authenticate against Google, and does not sync drafts back to Gmail servers beyond DOM insertion.
- Because the backend URL is configurable, the manifest uses broad host permissions for demo flexibility.

## Suggested future improvements

1. Migrate to TypeScript plus a small build step for stronger typing and easier maintenance.
2. Add an authenticated backend flow and scoped host permissions.
3. Improve Gmail extraction with more selector variants and richer parsing of participants and quoted text.
4. Cache results per thread and show action history.
5. Add a richer compose integration that can open a draft automatically and insert structured HTML.
