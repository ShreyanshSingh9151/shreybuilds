const DEFAULT_SETTINGS = {
  backendBaseUrl: "http://localhost:8080",
  selectedModel: "auto",
  tone: "professional",
  length: "medium",
  demoMode: true,
  provider: "auto"
};

const form = document.getElementById("settings-form");
const statusNode = document.getElementById("status");
const testConnectionButton = document.getElementById("test-connection");

initialize();

async function initialize() {
  const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  document.getElementById("backendBaseUrl").value = settings.backendBaseUrl || DEFAULT_SETTINGS.backendBaseUrl;
  document.getElementById("selectedModel").value = settings.selectedModel || DEFAULT_SETTINGS.selectedModel;
  document.getElementById("tone").value = settings.tone || DEFAULT_SETTINGS.tone;
  document.getElementById("length").value = settings.length || DEFAULT_SETTINGS.length;
  document.getElementById("demoMode").checked = settings.demoMode !== false;
  document.getElementById("provider").value = settings.provider || DEFAULT_SETTINGS.provider;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const nextSettings = readFormSettings();
  await chrome.storage.sync.set(nextSettings);
  setStatus("Settings saved.");
});

testConnectionButton.addEventListener("click", async () => {
  const nextSettings = readFormSettings();
  await chrome.storage.sync.set(nextSettings);

  setStatus("Testing backend connection...");

  chrome.runtime.sendMessage(
    {
      type: "mailpilot:api-request",
      payload: {
        endpoint: "/health",
        method: "GET"
      }
    },
    (response) => {
      if (chrome.runtime.lastError) {
        setStatus(chrome.runtime.lastError.message, true);
        return;
      }

      if (!response?.ok) {
        setStatus(response?.error || "Health check failed.", true);
        return;
      }

      const service = response.data?.service || "MailPilot backend";
      setStatus(`Connected to ${service}.`);
    }
  );
});

function readFormSettings() {
  return {
    backendBaseUrl: document.getElementById("backendBaseUrl").value.trim().replace(/\/+$/, ""),
    selectedModel: document.getElementById("selectedModel").value,
    tone: document.getElementById("tone").value,
    length: document.getElementById("length").value,
    demoMode: document.getElementById("demoMode").checked,
    provider: document.getElementById("provider").value
  };
}

function setStatus(message, isError = false) {
  statusNode.textContent = message;
  statusNode.classList.toggle("is-error", isError);
}
