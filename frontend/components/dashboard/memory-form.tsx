"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, Save } from "lucide-react";
import { api, mockApi } from "@/lib/api";
import type { MemoryPayload, MemoryPreferences } from "@/lib/types";

const emptyState: MemoryPayload = {
  name: "",
  signature: "",
  preferred_tone: "professional",
  default_model: "auto",
  tone_for_clients: "",
  tone_for_internal: "",
  common_instructions: ""
};

type SaveStatus = { type: "success" | "error"; message: string } | null;

export function MemoryForm({ initialValues, source }: { initialValues: MemoryPreferences; source: "api" | "mock" }) {
  const [form, setForm] = useState<MemoryPayload>(emptyState);
  const [status, setStatus] = useState<SaveStatus>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      name: initialValues.name,
      signature: initialValues.signature,
      preferred_tone: initialValues.preferred_tone,
      default_model: initialValues.default_model,
      tone_for_clients: initialValues.tone_for_clients,
      tone_for_internal: initialValues.tone_for_internal,
      common_instructions: initialValues.common_instructions
    });
  }, [initialValues]);

  function updateField(field: keyof MemoryPayload, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setStatus(null);

    try {
      await (source === "api" ? api.updateMemory(form) : mockApi.updateMemory(form));
      setStatus({ type: "success", message: "Preferences saved successfully" });
      setTimeout(() => setStatus(null), 3000);
    } catch (err) {
      setStatus({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to save preferences"
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="User Name">
          <input
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            className="input-field"
            placeholder="Vatsal Chaudhary"
          />
        </Field>

        <Field label="Default Model">
          <select
            value={form.default_model}
            onChange={(e) => updateField("default_model", e.target.value)}
            className="input-field"
          >
            <option value="auto">Auto (OpenRouter Smart Routing)</option>
            <option value="gpt">GPT Profile (OpenRouter-backed)</option>
            <option value="claude">Claude Profile (OpenRouter-backed)</option>
            <option value="gemini">Gemini Profile (OpenRouter-backed)</option>
          </select>
        </Field>

        <Field label="Preferred Tone">
          <input
            value={form.preferred_tone}
            onChange={(e) => updateField("preferred_tone", e.target.value)}
            className="input-field"
            placeholder="professional"
          />
        </Field>

        <Field label="Client Tone">
          <input
            value={form.tone_for_clients}
            onChange={(e) => updateField("tone_for_clients", e.target.value)}
            className="input-field"
            placeholder="Warm and consultative"
          />
        </Field>

        <Field label="Internal Tone">
          <input
            value={form.tone_for_internal}
            onChange={(e) => updateField("tone_for_internal", e.target.value)}
            className="input-field"
            placeholder="Direct and concise"
          />
        </Field>

        <Field label="Signature">
          <textarea
            value={form.signature}
            onChange={(e) => updateField("signature", e.target.value)}
            className="input-field min-h-[100px]"
            placeholder="Best regards..."
          />
        </Field>
      </div>

      <Field label="Custom Instructions">
        <textarea
          value={form.common_instructions}
          onChange={(e) => updateField("common_instructions", e.target.value)}
          className="input-field min-h-[120px]"
          placeholder="Tell the AI how to handle your inbox by default..."
        />
      </Field>

      <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs text-slate-500">
          Changes are sent to <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[10px]">POST /api/v1/memory/preferences</code> and are used by the extension when creating drafts.
        </p>
        <button type="submit" disabled={saving} className="btn-primary flex-shrink-0">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      {status && (
        <div
          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
            status.type === "success"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {status.type === "success" && <Check className="h-4 w-4" />}
          {status.message}
        </div>
      )}

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
        Memory settings now directly affect routing defaults and reply behavior (tone, signature, and instructions) in summarize/reply/rewrite flows.
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}
