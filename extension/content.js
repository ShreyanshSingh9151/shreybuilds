(function () {
  if (window.__MAILPILOT_AI_INITIALIZED__) {
    return;
  }

  window.__MAILPILOT_AI_INITIALIZED__ = true;

  const ROOT_ID = "mailpilot-ai-root";
  const MINIMIZED_KEY = "mailpilot.ai.minimized";
  const LAST_RESULT_KEY = "mailpilot.ai.lastResult";
  const MAX_CONTENT_LENGTH = 12000;
  const OUTLOOK_SAMPLE_THREAD = {
    provider: "outlook",
    threadId: "demo_outlook_staging_blocker",
    subject: "Deployment blocked in staging",
    sender: "alerts@infrahub.dev",
    content:
      "A staging deployment is blocked because the release gate failed on webhook validation. Please confirm whether the rollback plan is approved and share the new ETA. The customer success team needs a short summary for the account manager. Action requests: 1) engineering to confirm fix owner, 2) product to align on ETA, 3) support to draft customer update.",
    demoMode: true
  };
  const SAMPLE_THREAD = {
    provider: "gmail",
    threadId: "demo_thread_product_launch",
    subject: "Launch prep: partner assets and client approvals",
    sender: "nina.ops@vertexlabs.com",
    content:
      "Hi team,\n\nWe are finalizing launch assets for Monday. Please confirm the final CTA copy by 4 PM today and share updated banner dimensions. The client also asked if analytics tags are already embedded in the landing page.\n\nAction requests:\n1) Growth team to confirm CTA variant by 4 PM.\n2) Design to deliver 3 banner sizes for desktop and mobile.\n3) Engineering to verify tracking events and share screenshot proof.\n\nIf anything slips, we need to inform the client before EOD to avoid escalations.\n\nThanks,\nNina",
    demoMode: true
  };
  const ACTIONS = {
    summarize: {
      label: "Summarize Thread",
      endpoint: "/api/v1/threads/summarize"
    },
    reply: {
      label: "Draft Reply",
      endpoint: "/api/v1/threads/reply"
    },
    rewrite: {
      label: "Rewrite Tone",
      endpoint: "/api/v1/threads/rewrite"
    },
    classify: {
      label: "Classify Email",
      endpoint: "/api/v1/threads/classify"
    }
  };

  class MailPilotApp {
    constructor() {
      this.root = null;
      this.panel = null;
      this.minimizedBubble = null;
      this.observer = null;
      this.routeCheckTimer = null;
      this.lastThreadSignature = "";
      this.loading = false;
      this.lastResult = readSessionJSON(LAST_RESULT_KEY, null);
      this.currentThread = null;
      this.settings = {
        backendBaseUrl: "http://localhost:8080",
        selectedModel: "auto",
        tone: "professional",
        length: "medium",
        demoMode: true,
        provider: "auto"
      };
    }

    async init() {
      await this.loadSettings();
      this.ensureUi();
      this.attachObserver();
      this.refreshThreadContext();
      window.addEventListener("hashchange", () => this.scheduleRefresh());
      window.addEventListener("popstate", () => this.scheduleRefresh());
    }

    async loadSettings() {
      const response = await sendMessage({ type: "mailpilot:get-settings" });
      if (response?.ok && response.settings) {
        this.settings = { ...this.settings, ...response.settings };
      }
    }

    ensureUi() {
      this.root = document.getElementById(ROOT_ID);
      if (!this.root) {
        this.root = document.createElement("div");
        this.root.id = ROOT_ID;
        document.body.appendChild(this.root);
      }

      this.root.innerHTML = this.renderTemplate();
      this.panel = this.root.querySelector(".mailpilot-panel");
      this.minimizedBubble = this.root.querySelector(".mailpilot-launcher");

      this.bindUi();
      this.restoreSelections();
      this.applyMinimizedState(localStorage.getItem(MINIMIZED_KEY) === "true");
      this.renderResult(this.lastResult);
    }

    renderTemplate() {
      return `
        <button class="mailpilot-launcher" type="button">MailPilot AI</button>
        <aside class="mailpilot-panel" aria-live="polite">
          <div class="mailpilot-header">
            <div>
              <p class="mailpilot-eyebrow">Gmail + OpenRouter assistant</p>
              <h2>MailPilot AI</h2>
            </div>
            <div class="mailpilot-header-actions">
              <button class="mailpilot-icon-btn" data-action="refresh" type="button" title="Refresh thread">↻</button>
              <button class="mailpilot-icon-btn" data-action="toggle-minimize" type="button" title="Minimize panel">-</button>
            </div>
          </div>

          <div class="mailpilot-thread-card">
            <div class="mailpilot-thread-status" data-role="thread-status">Looking for an open email thread...</div>
            <div class="mailpilot-demo-badge" data-role="demo-badge" hidden>Demo mode active (sample thread)</div>
            <div class="mailpilot-thread-meta">
              <div>
                <span class="mailpilot-meta-label">Subject</span>
                <strong data-role="subject">-</strong>
              </div>
              <div>
                <span class="mailpilot-meta-label">Sender</span>
                <strong data-role="sender">-</strong>
              </div>
            </div>
          </div>

          <div class="mailpilot-controls">
            <label>
              <span>Provider</span>
              <select data-setting="provider">
                <option value="auto">Auto detect</option>
                <option value="gmail">Gmail only</option>
                <option value="outlook">Outlook Web only</option>
              </select>
            </label>
            <label>
              <span>Profile</span>
              <select data-setting="selectedModel">
                <option value="gpt">GPT (OpenRouter)</option>
                <option value="claude">Claude (OpenRouter)</option>
                <option value="gemini">Gemini (OpenRouter)</option>
                <option value="auto">Auto (OpenRouter routing)</option>
              </select>
            </label>
            <label>
              <span>Tone</span>
              <select data-setting="tone">
                <option value="professional">Professional</option>
                <option value="formal">Formal</option>
                <option value="friendly">Friendly</option>
                <option value="casual">Casual</option>
              </select>
            </label>
            <label>
              <span>Length</span>
              <select data-setting="length">
                <option value="short">Short</option>
                <option value="medium">Medium</option>
                <option value="long">Long</option>
              </select>
            </label>
          </div>

          <div class="mailpilot-actions-grid">
            <button class="mailpilot-primary" data-request-action="summarize" type="button">Summarize Thread</button>
            <button class="mailpilot-primary" data-request-action="reply" type="button">Draft Reply</button>
            <button class="mailpilot-secondary" data-request-action="rewrite" type="button">Rewrite Tone</button>
            <button class="mailpilot-secondary" data-request-action="classify" type="button">Classify Email</button>
            <button class="mailpilot-secondary" data-action="load-sample-thread" type="button">Load Sample Thread</button>
            <button class="mailpilot-ghost" data-action="save-preference" type="button">Save Preference</button>
          </div>

          <div class="mailpilot-feedback" data-role="feedback"></div>

          <section class="mailpilot-result" data-role="result">
            <div class="mailpilot-empty-state">
              Run an action to see summary, reply, classification, priority, model, cost, and latency here.
            </div>
          </section>
        </aside>
      `;
    }

    bindUi() {
      this.root.addEventListener("click", (event) => {
        const target = event.target.closest("button");
        if (!target) {
          return;
        }

        const panelAction = target.dataset.action;
        const requestAction = target.dataset.requestAction;

        if (panelAction === "toggle-minimize") {
          this.applyMinimizedState(true);
        } else if (target.classList.contains("mailpilot-launcher")) {
          this.applyMinimizedState(false);
        } else if (panelAction === "refresh") {
          this.refreshThreadContext(true);
        } else if (panelAction === "load-sample-thread") {
          this.loadSampleThread();
        } else if (panelAction === "save-preference") {
          this.savePreference();
        } else if (panelAction === "copy-output") {
          this.copyOutput();
        } else if (panelAction === "insert-compose") {
          this.insertIntoCompose();
        } else if (requestAction) {
          this.runAction(requestAction);
        }
      });

      this.root.addEventListener("change", async (event) => {
        const target = event.target;
        if (!(target instanceof HTMLSelectElement)) {
          return;
        }

        const settingKey = target.dataset.setting;
        if (!settingKey) {
          return;
        }

        this.settings[settingKey] = target.value;
        await sendMessage({
          type: "mailpilot:save-settings",
          payload: { [settingKey]: target.value }
        });
      });
    }

    restoreSelections() {
      this.root.querySelectorAll("select[data-setting]").forEach((select) => {
        const settingKey = select.dataset.setting;
        if (settingKey && this.settings[settingKey]) {
          select.value = this.settings[settingKey];
        }
      });
    }

    attachObserver() {
      if (this.observer) {
        this.observer.disconnect();
      }

      this.observer = new MutationObserver(() => this.scheduleRefresh());
      this.observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: false
      });
    }

    scheduleRefresh() {
      window.clearTimeout(this.routeCheckTimer);
      this.routeCheckTimer = window.setTimeout(() => this.refreshThreadContext(), 350);
    }

    refreshThreadContext(force = false) {
      const extractedThread = extractVisibleThread(this.settings.provider);
      const thread = extractedThread || (this.settings.demoMode ? fallbackThreadForProvider(this.settings.provider, hostnameProvider()) : null);
      const signature = thread ? `${thread.threadId}:${thread.subject}:${thread.sender}:${thread.content.length}` : "no-thread";

      if (!force && signature === this.lastThreadSignature) {
        return;
      }

      this.lastThreadSignature = signature;
      this.currentThread = thread;
      this.updateThreadSummary(thread);
    }

    loadSampleThread() {
      const sample = fallbackThreadForProvider(this.settings.provider, hostnameProvider());
      this.currentThread = { ...sample };
      this.lastThreadSignature = `${sample.threadId}:${sample.subject}:${sample.sender}:${sample.content.length}`;
      this.updateThreadSummary(this.currentThread);
      this.setFeedback("Loaded sample thread for demo.", false);
    }

    updateThreadSummary(thread) {
      const status = this.root.querySelector('[data-role="thread-status"]');
      const subject = this.root.querySelector('[data-role="subject"]');
      const sender = this.root.querySelector('[data-role="sender"]');
      const demoBadge = this.root.querySelector('[data-role="demo-badge"]');

      if (!thread) {
        status.textContent = "Open a Gmail or Outlook Web conversation to enable actions.";
        subject.textContent = "-";
        sender.textContent = "-";
        if (demoBadge) {
          demoBadge.hidden = true;
        }
        return;
      }

      const defaultStatus = `${thread.provider === "outlook" ? "Outlook" : "Gmail"} thread detected (${thread.content.length} chars ready)`;
      status.textContent = thread.extractionStatus || defaultStatus;
      subject.textContent = thread.subject || "No subject found";
      sender.textContent = thread.sender || "No sender found";
      if (demoBadge) {
        demoBadge.hidden = !thread.demoMode;
      }
    }

    applyMinimizedState(minimized) {
      this.panel.classList.toggle("is-hidden", minimized);
      this.minimizedBubble.classList.toggle("is-visible", minimized);
      localStorage.setItem(MINIMIZED_KEY, String(minimized));
    }

    async runAction(actionKey) {
      if (this.loading) {
        return;
      }

    const action = ACTIONS[actionKey];
    const thread = this.currentThread || extractVisibleThread(this.settings.provider) || fallbackThreadForProvider(this.settings.provider, hostnameProvider());

    if (!thread) {
        this.setFeedback("Open a Gmail or Outlook thread first.", true);
        return;
      }

      const content = thread.content;

      const payload = {
        provider: thread.provider || (this.settings.provider === "outlook" ? "outlook" : "gmail"),
        thread_id: thread.threadId,
        subject: thread.subject,
        sender: thread.sender,
        content,
        selected_model: this.settings.selectedModel,
        tone: this.settings.tone,
        length: this.settings.length
      };

      this.setLoading(action.label);

      try {
        const response = await sendMessage({
          type: "mailpilot:api-request",
          payload: {
            endpoint: action.endpoint,
            method: "POST",
            body: payload
          }
        });

        if (!response?.ok) {
          throw new Error(response?.error || "Unknown request error");
        }

        this.lastResult = response.data;
        writeSessionJSON(LAST_RESULT_KEY, this.lastResult);
        this.renderResult(response.data);
        this.setFeedback(`${action.label} complete.`, false);
      } catch (error) {
        this.setFeedback(error.message || "The request failed.", true);
      } finally {
        this.loading = false;
        this.root.classList.remove("is-loading");
      }
    }

    async savePreference() {
      this.setLoading("Saving preference");

      try {
        const response = await sendMessage({
          type: "mailpilot:api-request",
          payload: {
            endpoint: "/api/v1/memory/preferences",
            method: "POST",
            body: {
              name: "Vatsal Chaudhary",
              signature: "Best regards,\nVatsal Chaudhary",
              default_model: this.settings.selectedModel,
              preferred_tone: this.settings.tone,
              common_instructions: `Preferred reply length: ${this.settings.length}. Keep responses concise and specific to thread context.`
            }
          }
        });

        if (!response?.ok) {
          throw new Error(response?.error || "Preference save failed");
        }

        this.setFeedback("Preference saved to MailPilot AI memory.", false);
      } catch (error) {
        this.setFeedback(error.message || "Preference save failed.", true);
      } finally {
        this.loading = false;
        this.root.classList.remove("is-loading");
      }
    }

    setLoading(label) {
      this.loading = true;
      this.root.classList.add("is-loading");
      this.setFeedback(`${label}...`, false, true);
    }

    setFeedback(message, isError, isLoading = false) {
      const feedback = this.root.querySelector('[data-role="feedback"]');
      feedback.textContent = message;
      feedback.className = "mailpilot-feedback";
      if (isError) {
        feedback.classList.add("is-error");
      }
      if (isLoading) {
        feedback.classList.add("is-loading");
      }
    }

    renderResult(result) {
      const container = this.root.querySelector('[data-role="result"]');

      if (!result) {
        container.innerHTML = `
          <div class="mailpilot-empty-state">
            Run an action to see summary, reply, classification, priority, model, cost, and latency here.
          </div>
        `;
        return;
      }

      const modelUsed = result.routed_model || result.selected_model || "-";
      const output = escapeHtml(result.output || result.summary || "");

      const summaryBlock = result.summary
        ? `<div class="mailpilot-block"><h3>Summary</h3><p>${escapeHtml(result.summary)}</p></div>`
        : "";

      const selfAuthoredNote = this.currentThread && looksLikeSelfAuthoredThread(this.currentThread)
        ? `<div class="mailpilot-note">This looks like one of your own messages in the thread. Reply drafts should continue from your voice, not thank you as the recipient.</div>`
        : "";

      const classificationText = result.classification
        ? `${result.classification.category} (${Math.round((result.classification.confidence || 0) * 100)}%)`
        : "";
      const priorityText = result.priority
        ? `${result.priority.level} (${result.priority.score}/10)`
        : "";
      const routedModel = result.routed_model || "-";
      const routeReason = result.route_reason || "-";
      const confidenceText = typeof result.confidence === "number"
        ? `${Math.round(result.confidence * 100)}%`
        : result.classification?.confidence
          ? `${Math.round(result.classification.confidence * 100)}%`
          : "-";
      const priorityReason = result.priority_reason || result.priority?.reason || "-";
      const actionItemsCount = Number(result.action_items_count || (Array.isArray(result.action_items) ? result.action_items.length : 0));
      const tokens = Number(result.tokens_estimate || 0);
      const cost = Number(result.cost_estimate || 0);
      const savings = Number(result.cost_savings_usd || 0);

      const classificationMetric = classificationText
        ? `<div><span>Classification</span><strong>${escapeHtml(classificationText)}</strong></div>`
        : "";
      const priorityMetric = priorityText
        ? `<div><span>Priority</span><strong>${escapeHtml(priorityText)}</strong></div>`
        : "";

      const actionItems = Array.isArray(result.action_items) && result.action_items.length > 0
        ? `<div class="mailpilot-block"><h3>Action Items</h3><ul>${result.action_items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div>`
        : "";

      container.innerHTML = `
        ${summaryBlock}
        ${selfAuthoredNote}
        <div class="mailpilot-block">
          <div class="mailpilot-block-header">
            <h3>Generated Output</h3>
            <div class="mailpilot-inline-actions">
              <button class="mailpilot-mini-btn" data-action="copy-output" type="button">Copy</button>
              <button class="mailpilot-mini-btn" data-action="insert-compose" type="button">Insert</button>
            </div>
          </div>
          <pre>${output || "-"}</pre>
        </div>
        <div class="mailpilot-metrics">
          ${classificationMetric}
          ${priorityMetric}
          <div><span>Routed Model</span><strong>${escapeHtml(routedModel)}</strong></div>
          <div><span>Route Reason</span><strong>${escapeHtml(routeReason)}</strong></div>
          <div><span>Confidence</span><strong>${escapeHtml(confidenceText)}</strong></div>
          <div><span>Priority Reason</span><strong>${escapeHtml(priorityReason)}</strong></div>
          <div><span>Action Items</span><strong>${actionItemsCount}</strong></div>
          <div><span>Tokens</span><strong>${tokens}</strong></div>
          <div><span>Estimated Cost</span><strong>$${cost.toFixed(4)}</strong></div>
          <div><span>Routing Savings</span><strong>$${savings.toFixed(4)}</strong></div>
          <div><span>Latency</span><strong>${Number(result.latency_ms || 0)} ms</strong></div>
          <div><span>Selected Label</span><strong>${escapeHtml(modelUsed)}</strong></div>
        </div>
        ${actionItems}
      `;
    }

    async copyOutput() {
      const value = this.lastResult?.output || this.lastResult?.summary;
      if (!value) {
        this.setFeedback("Nothing to copy yet.", true);
        return;
      }

      await navigator.clipboard.writeText(value);
      this.setFeedback("Copied to clipboard.", false);
    }

    insertIntoCompose() {
      const value = this.lastResult?.output || this.lastResult?.summary;
      if (!value) {
        this.setFeedback("Generate a reply before inserting.", true);
        return;
      }

      const composeBox = findActiveComposeBox();
      if (!composeBox) {
        this.setFeedback("No open compose box found. Click Reply in Gmail first, then Insert.", true);
        return;
      }

      composeBox.focus();
      document.execCommand("insertText", false, value);
      if (composeBox.innerText.trim() !== value.trim()) {
        composeBox.textContent = value;
        composeBox.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: value }));
      }

      this.setFeedback("Inserted into Gmail compose.", false);
    }
  }

  function extractVisibleThread(providerPreference = "auto") {
    const hostname = window.location.hostname;
    const isOutlookHost = isOutlookHostName(hostname);

    if (providerPreference === "gmail" && isOutlookHost) {
      return null;
    }
    if (providerPreference === "outlook" && !isOutlookHost) {
      return null;
    }

    if (isOutlookHost) {
      return extractOutlookThread();
    }

    const main = document.querySelector('div[role="main"]');
    if (!main) {
      return null;
    }

    const threadLikeRoute = /#(?:inbox|sent|all|starred|drafts|label|category)\/.+/.test(window.location.hash);
    const hasThreadMarker = Boolean(main.querySelector('[data-thread-perm-id], div[role="listitem"]'));
    if (!threadLikeRoute && !hasThreadMarker) {
      return null;
    }

    const bodies = Array.from(main.querySelectorAll('div.a3s.aiL, div.a3s, div[role="listitem"] div.a3s'))
      .filter((node) => isElementVisible(node))
      .map((node) => sanitizeText(node.innerText))
      .filter(Boolean);

    if (bodies.length === 0) {
      return null;
    }

    const subject = sanitizeText(
      pickText([
        'h2[data-thread-perm-id]',
        'h2.hP',
        'div[role="main"] h2'
      ]) || document.title.replace(/\s*-\s*Gmail$/, "")
    );

    const sender = sanitizeText(
      pickText([
        'span[email].gD',
        'h3 span[email]',
        'span[email]',
        '.go span[email]'
      ])
    );

    const threadId = extractThreadId(subject, sender, bodies.join("\n"));
    const content = truncateText(bodies.join("\n\n-----\n\n"), MAX_CONTENT_LENGTH);

    return {
      provider: "gmail",
      threadId,
      subject: subject || "No subject",
      sender: sender || "Unknown sender",
      content
    };
  }

  function extractOutlookThread() {
    const main = findOutlookReadingPane();
    if (!main) {
      return null;
    }

    const headerRegion = findOutlookHeaderRegion(main);
    const headerText = headerRegion ? sanitizeText(headerRegion.innerText || headerRegion.textContent || "") : "";
    const subject = extractOutlookSubject(main, headerRegion, headerText) || "No subject";
    const sender = extractOutlookSender(main, headerRegion, headerText) || "Unknown sender";
    const content = extractOutlookBody(main);

    if (!content) {
      return null;
    }

    const extractedHeaders = subject !== "No subject" || sender !== "Unknown sender";

    return {
      provider: "outlook",
      threadId: `outlook_${simpleHash(`${subject}|${sender}|${content.slice(0, 500)}`)}`,
      subject,
      sender,
      content,
      extractionStatus: extractedHeaders
        ? "Outlook thread detected · Extracted headers from visible message"
        : "Outlook thread detected · Using safe header fallback"
    };
  }

  function extractVisibleTextFallback() {
    const candidates = Array.from(document.querySelectorAll('body *'))
      .filter((node) => isElementVisible(node))
      .map((node) => sanitizeText(node.innerText || node.textContent || ""))
      .filter((text) => text.length > 40)
      .slice(0, 40);

    if (candidates.length === 0) {
      return "";
    }

    return truncateText(candidates.join("\n\n"), MAX_CONTENT_LENGTH);
  }

  function fallbackThreadForProvider(provider, hostProvider = "gmail") {
    const effective = provider === "auto" ? hostProvider : provider;
    const sample = effective === "outlook" ? { ...OUTLOOK_SAMPLE_THREAD } : { ...SAMPLE_THREAD };
    sample.extractionStatus = effective === "outlook" ? "Using fallback thread · Outlook sample" : "Using fallback thread · Gmail sample";
    return sample;
  }

  function looksLikeSelfAuthoredThread(thread) {
    const sender = String(thread?.sender || "").toLowerCase();
    const subject = String(thread?.subject || "").toLowerCase();
    const content = String(thread?.content || "").toLowerCase();
    const localClues = ["vatsal", "chaudhary", "vatsal chaudhary", "vatsalchaudhary01@gmail.com"];

    if (localClues.some((clue) => sender.includes(clue))) {
      return true;
    }

    if (!sender && /\b(i will|i am|i've|i have|let me|great\.|confirmed\.|thanks,\s*vatsal)\b/i.test(content)) {
      return true;
    }

    return /\b(vatsal|chaudhary)\b/i.test(subject) && /\b(i will|confirmed|great\.)\b/i.test(content);
  }

  function hostnameProvider() {
    const hostname = window.location.hostname;
    return isOutlookHostName(hostname) ? "outlook" : "gmail";
  }

  function isOutlookHostName(hostname) {
    return (
      hostname === "outlook.cloud.microsoft" ||
      hostname === "outlook.office.com" ||
      hostname === "outlook.office365.com" ||
      hostname === "outlook.live.com"
    );
  }

  function findOutlookReadingPane() {
    const selectors = [
      '[data-app-section="MailReadingPane"]',
      '[data-testid="ReadingPane"]',
      '[aria-label*="Reading pane"]',
      '[aria-label*="reading pane"]',
      'div[role="main"]'
    ];

    for (const selector of selectors) {
      const node = Array.from(document.querySelectorAll(selector)).find((candidate) => isElementVisible(candidate));
      if (node) {
        return node;
      }
    }

    return null;
  }

  function findOutlookHeaderRegion(main) {
    const headerSelectors = [
      '[data-testid*="message-header"]',
      '[data-testid*="messageHeader"]',
      '[data-app-section*="MessageHeader"]',
      '[aria-label*="message header" i]',
      '[aria-label*="mail header" i]',
      'header'
    ];

    for (const selector of headerSelectors) {
      const nodes = Array.from(main.querySelectorAll(selector));
      for (const node of nodes) {
        if (!isElementVisible(node)) {
          continue;
        }

        return node;
      }
    }

    return null;
  }

  function extractOutlookSubject(main, headerRegion, headerText) {
    const root = headerRegion || null;
    const subjectSelectors = [
      '[data-testid="message-subject"]',
      '[data-testid*="subject"]',
      '[aria-label*="subject" i]',
      '[aria-label^="Subject" i]',
      '[role="heading"][aria-level="1"]',
      '[role="heading"][aria-level="2"]',
      'h1[aria-label]',
      'h1[title]',
      'h2[aria-label]',
      'h2[title]'
    ];

    const candidate = findFirstVisibleText(root, subjectSelectors, (text, node) => isLikelyOutlookSubject(text, node));
    if (candidate) {
      return candidate;
    }

    const titleCandidate = extractOutlookSubjectFromTitle(document.title);
    if (titleCandidate) {
      return titleCandidate;
    }

    if (headerRegion && headerText) {
      const lines = splitVisibleLines(headerText);
      for (const line of lines) {
        const parsed = parseHeaderLine(line, "subject");
        if (parsed && isLikelyOutlookSubject(parsed)) {
          return parsed;
        }
      }
    }

    return "";
  }

  function extractOutlookSender(main, headerRegion, headerText) {
    const root = headerRegion || null;
    if (!root) {
      return "";
    }

    const senderSelectors = [
      '[data-testid="message-from"]',
      '[data-testid*="from"]',
      '[aria-label*="from" i]',
      '[aria-label^="From" i]',
      '[data-testid*="sender" i]',
      'a[href^="mailto:"]',
      'button[aria-label*="from" i]',
      '[role="button"][aria-label*="from" i]',
      '[role="link"][aria-label*="from" i]'
    ];

    const candidate = findFirstVisibleText(root, senderSelectors, (text, node) => isLikelyOutlookSender(text, node));
    if (candidate) {
      return candidate;
    }

    if (headerRegion && headerText) {
      const lines = splitVisibleLines(headerText);
      for (const line of lines) {
        const parsed = parseHeaderLine(line, "from");
        if (parsed) {
          return parsed;
        }
      }
    }

    return "";
  }

  function extractOutlookBody(main) {
    const bodySelectors = [
      '[data-testid="message-body"]',
      '[role="document"]',
      '[aria-label*="message body" i]',
      '[aria-label*="Message body" i]',
      '[data-message-id]'
    ];

    for (const selector of bodySelectors) {
      const nodes = Array.from(main.querySelectorAll(selector));
      for (const node of nodes) {
        if (!isElementVisible(node)) {
          continue;
        }

        const text = sanitizeText(node.innerText || node.textContent || "");
        if (text.length > 20) {
          return truncateText(text, MAX_CONTENT_LENGTH);
        }
      }
    }

    const candidates = Array.from(main.querySelectorAll('div, p, span'))
      .filter((node) => isElementVisible(node))
      .map((node) => sanitizeText(node.innerText || node.textContent || ""))
      .filter((text) => text.length > 40 && !looksLikeHeaderLine(text));

    const content = truncateText(candidates.join("\n\n"), MAX_CONTENT_LENGTH);
    return content || extractVisibleTextFallback();
  }

  function findFirstVisibleText(root, selectors, predicate) {
    if (!root) {
      return "";
    }

    for (const selector of selectors) {
      const nodes = Array.from(root.querySelectorAll(selector));
      for (const node of nodes) {
        if (!isElementVisible(node)) {
          continue;
        }

        const text = sanitizeText(node.getAttribute("aria-label") || node.getAttribute("title") || node.textContent || node.innerText || "");
        if (text && predicate(text, node)) {
          return normalizeHeaderText(text);
        }
      }
    }

    return "";
  }

  function isLikelyOutlookSubject(value, node) {
    const text = normalizeHeaderText(value);
    if (!text) {
      return false;
    }

    if (looksLikeEmail(text)) {
      return false;
    }

    if (/^(from|to|cc|bcc|subject|attachments?)\b[:\s]/i.test(text)) {
      return false;
    }

    if (/^\d{1,2}[:\/]\d{1,2}/.test(text)) {
      return false;
    }

    if (/^(outlook|inbox|mail|focused|other|drafts?|sent items?)$/i.test(text)) {
      return false;
    }

    if (node) {
      const nodeHints = nodeHintText(node);
      if (/subject|thread|header/i.test(nodeHints)) {
        return text.length >= 3 && text.length <= 180;
      }

      if (node.tagName && /^(H1|H2)$/i.test(node.tagName) && /heading/i.test(String(node.getAttribute("role") || ""))) {
        return text.length >= 3 && text.length <= 180;
      }
    }

    return /^((re|fw|fwd):)/i.test(text);
  }

  function isLikelyOutlookSender(value, node) {
    const text = normalizeHeaderText(value);
    if (!text) {
      return false;
    }

    if (looksLikeEmail(text)) {
      return true;
    }

    if (/^from[:\s]/i.test(text)) {
      return true;
    }

    if (/\b<[^>]+@[^>]+>/.test(text)) {
      return true;
    }

    if (node) {
      const nodeHints = nodeHintText(node);
      if (/from|sender|author/i.test(nodeHints)) {
        return true;
      }
    }

    return false;
  }

  function parseHeaderLine(value, label) {
    const text = normalizeHeaderText(value);
    if (!text) {
      return "";
    }

    const pattern = new RegExp(`^${label}[:\\s-]+(.+)$`, "i");
    const match = text.match(pattern);
    if (match?.[1]) {
      return normalizeHeaderText(match[1]);
    }

    if (looksLikeEmail(text) || /\b<[^>]+@[^>]+>/.test(text)) {
      return text;
    }

    return "";
  }

  function extractOutlookSubjectFromTitle(title) {
    const normalized = sanitizeText(String(title || "").replace(/\s*[-|]\s*Outlook.*$/i, ""));
    if (!normalized) {
      return "";
    }

    if (/^(outlook|inbox|mail|focused|other|drafts?|sent items?)$/i.test(normalized)) {
      return "";
    }

    return normalized;
  }

  function normalizeHeaderText(value) {
    return sanitizeText(String(value || "").replace(/\s*[-|]\s*Outlook.*$/i, ""));
  }

  function nodeHintText(node) {
    return sanitizeText(
      [
        node.getAttribute("aria-label"),
        node.getAttribute("title"),
        node.getAttribute("data-testid"),
        node.getAttribute("role")
      ]
        .filter(Boolean)
        .join(" ")
    );
  }

  function looksLikeEmail(value) {
    return /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(String(value || ""));
  }

  function looksLikeHeaderLine(value) {
    return /^(from|to|cc|bcc|subject|sent|attachments?)\b[:\s]/i.test(String(value || ""));
  }

  function splitVisibleLines(value) {
    return String(value || "")
      .split(/\n+/)
      .map((line) => sanitizeText(line))
      .filter(Boolean);
  }

  function extractThreadId(subject, sender, content) {
    const hash = window.location.hash || "";
    const urlMatch = hash.match(/\/(?:[A-Za-z0-9]+\/)?([A-Za-z0-9_-]{10,})$/);
    if (urlMatch?.[1]) {
      return urlMatch[1];
    }

    const explicitNode = document.querySelector('[data-thread-perm-id]');
    if (explicitNode?.getAttribute('data-thread-perm-id')) {
      return explicitNode.getAttribute('data-thread-perm-id');
    }

    return `fallback_${simpleHash(`${subject}|${sender}|${content.slice(0, 500)}`)}`;
  }

  function pickText(selectors) {
    for (const selector of selectors) {
      const nodes = Array.from(document.querySelectorAll(selector));
      for (const node of nodes) {
        if (isElementVisible(node)) {
          const text = sanitizeText(node.textContent || node.innerText || "");
          if (text) {
            return text;
          }
        }
      }
    }
    return "";
  }

  function findActiveComposeBox() {
    const candidates = Array.from(document.querySelectorAll(
      'div[role="textbox"][g_editable="true"], ' +
      'div[aria-label="Message Body"], ' +
      'div.Am.Al.editable, ' +
      'div[contenteditable="true"][role="textbox"], ' +
      'div[contenteditable="true"][aria-label*="Body"], ' +
      'div[contenteditable="true"][aria-label*="body"]'
    ));
    return candidates.find((node) => isElementVisible(node)) || null;
  }

  function isElementVisible(node) {
    if (!(node instanceof HTMLElement)) {
      return false;
    }

    const style = window.getComputedStyle(node);
    if (style.display === "none" || style.visibility === "hidden") {
      return false;
    }

    const rect = node.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function sanitizeText(value) {
    return String(value || "")
      .replace(/\u00a0/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function truncateText(value, limit) {
    if (value.length <= limit) {
      return value;
    }

    return `${value.slice(0, limit)}...`;
  }

  function simpleHash(value) {
    let hash = 0;
    for (let index = 0; index < value.length; index += 1) {
      hash = (hash << 5) - hash + value.charCodeAt(index);
      hash |= 0;
    }
    return Math.abs(hash).toString(36);
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function readSessionJSON(key, fallback) {
    try {
      const raw = sessionStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_error) {
      return fallback;
    }
  }

  function writeSessionJSON(key, value) {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch (_error) {
      // Ignore storage failures in demo mode.
    }
  }

  function sendMessage(message) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          resolve({ ok: false, error: chrome.runtime.lastError.message });
          return;
        }
        resolve(response);
      });
    });
  }

  new MailPilotApp().init();
})();
