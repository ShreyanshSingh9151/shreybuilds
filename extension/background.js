const DEFAULT_SETTINGS = {
  backendBaseUrl: "http://localhost:8080",
  selectedModel: "auto",
  tone: "professional",
  length: "medium",
  demoMode: true,
  provider: "auto"
};

chrome.runtime.onInstalled.addListener(async () => {
  const stored = await chrome.storage.sync.get(Object.keys(DEFAULT_SETTINGS));
  const nextSettings = {};

  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    if (!stored[key]) {
      nextSettings[key] = value;
    }
  }

  if (Object.keys(nextSettings).length > 0) {
    await chrome.storage.sync.set(nextSettings);
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || !message.type) {
    return false;
  }

  if (message.type === "mailpilot:get-settings") {
    chrome.storage.sync
      .get(DEFAULT_SETTINGS)
      .then((settings) => sendResponse({ ok: true, settings: { ...DEFAULT_SETTINGS, ...settings } }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));

    return true;
  }

  if (message.type === "mailpilot:save-settings") {
    chrome.storage.sync
      .set(message.payload || {})
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));

    return true;
  }

  if (message.type === "mailpilot:api-request") {
    handleApiRequest(message.payload)
      .then((result) => sendResponse({ ok: true, data: result }))
      .catch((error) => sendResponse({ ok: false, error: error.message }));

    return true;
  }

  return false;
});

async function handleApiRequest(payload) {
  const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  const baseUrl = sanitizeBaseUrl(settings.backendBaseUrl || DEFAULT_SETTINGS.backendBaseUrl);
  const endpoint = payload?.endpoint || "/health";
  const method = payload?.method || "GET";

  const response = await fetch(`${baseUrl}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json"
    },
    body: payload?.body ? JSON.stringify(payload.body) : undefined
  });

  const text = await response.text();
  let parsed;

  try {
    parsed = text ? JSON.parse(text) : {};
  } catch (_error) {
    parsed = { raw: text };
  }

  if (!response.ok) {
    const message = parsed?.error || parsed?.message || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return parsed;
}

function sanitizeBaseUrl(value) {
  return String(value || DEFAULT_SETTINGS.backendBaseUrl).replace(/\/+$/, "");
}
