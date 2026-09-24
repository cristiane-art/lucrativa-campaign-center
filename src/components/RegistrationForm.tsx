"use client";

import { useState } from "react";
import { Card, Label, Input, Textarea, Button } from "@/components/ui";
import { PARTICIPANT_SEGMENTS, PARTICIPANT_SEGMENT_LABELS } from "@/lib/types";

interface FormState {
  name: string;
  phone: string;
  email: string;
  company: string;
  role: string;
  city: string;
  segment: string;
  agroRelation: string;
  decisionInfluence: boolean | null;
  isExistingClient: string;
  diagnosticInterest: string;
  marketingConsent: boolean;
}

const EMPTY: FormState = {
  name: "",
  phone: "",
  email: "",
  company: "",
  role: "",
  city: "",
  segment: "",
  agroRelation: "",
  decisionInfluence: null,
  isExistingClient: "",
  diagnosticInterest: "",
  marketingConsent: false,
};

function SegmentedChoice<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T | "";
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
            value === opt.value ? "border-accent bg-accent text-white" : "border-border bg-surface text-ink hover:border-accent"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function readTrackingFromUrl() {
  if (typeof window === "undefined") return { source: "landing_page", utmSource: "", utmMedium: "", utmCampaign: "", utmContent: "" };
  const params = new URLSearchParams(window.location.search);
  const partner = params.get("partner");
  if (partner) {
    return { source: "partner", utmSource: "partner", utmMedium: "referral", utmCampaign: params.get("utm_campaign") ?? "", utmContent: partner };
  }
  const utmSource = params.get("utm_source");
  return {
    source: utmSource || "landing_page",
    utmSource: utmSource ?? "",
    utmMedium: params.get("utm_medium") ?? "",
    utmCampaign: params.get("utm_campaign") ?? "",
    utmContent: params.get("utm_content") ?? "",
  };
}

export function RegistrationForm({ campaignId, ctaLabel }: { campaignId: string; ctaLabel: string }) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [operationalConsent, setOperationalConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "duplicate" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!operationalConsent) {
      setError("Confirme a autorização para uso dos seus dados neste credenciamento.");
      return;
    }
    setStatus("sending");
    setError(null);
    try {
      const tracking = readTrackingFromUrl();
      const res = await fetch("/api/registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId,
          ...form,
          decisionInfluence: form.decisionInfluence ?? undefined,
          ...tracking,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStatus(data.duplicate ? "duplicate" : "done");
    } catch (err) {
      setStatus("error");
      setError((err as Error).message);
    }
  }

  if (status === "done" || status === "duplicate") {
    return (
      <Card className="p-6 text-center">
        <p className="font-display text-lg font-semibold text-accent-strong">
          {status === "duplicate" ? "Você já possui uma inscrição para este evento." : "Inscrição confirmada!"}
        </p>
        <p className="mt-1 text-sm text-muted">
          {status === "duplicate"
            ? "Atualizamos seus dados com o que você acabou de enviar."
            : "Salve este evento na sua agenda. Enviaremos um lembrete próximo à data."}
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <form onSubmit={submit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Nome completo *</Label>
            <Input required value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div>
            <Label>WhatsApp *</Label>
            <Input required value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="(00) 00000-0000" />
          </div>
          <div>
            <Label>E-mail *</Label>
            <Input required type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
          </div>
          <div>
            <Label>Empresa *</Label>
            <Input required value={form.company} onChange={(e) => set("company", e.target.value)} />
          </div>
          <div>
            <Label>Cargo/Função *</Label>
            <Input required value={form.role} onChange={(e) => set("role", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label>Cidade *</Label>
            <Input required value={form.city} onChange={(e) => set("city", e.target.value)} />
          </div>
        </div>

        <div>
          <Label>Você atua em qual área? *</Label>
          <SegmentedChoice
            options={PARTICIPANT_SEGMENTS.map((s) => ({ value: s, label: PARTICIPANT_SEGMENT_LABELS[s] }))}
            value={form.segment as (typeof PARTICIPANT_SEGMENTS)[number] | ""}
            onChange={(v) => set("segment", v)}
          />
        </div>

        <div>
          <Label>Qual é sua relação com o agro? (opcional)</Label>
          <Textarea rows={2} value={form.agroRelation} onChange={(e) => set("agroRelation", e.target.value)} />
        </div>

        <div className="space-y-4 rounded-xl bg-surface-2 p-4">
          <div>
            <Label>Você participa ou influencia decisões relacionadas a propriedades rurais?</Label>
            <SegmentedChoice
              options={[
                { value: "sim", label: "Sim" },
                { value: "nao", label: "Não" },
              ]}
              value={form.decisionInfluence === null ? "" : form.decisionInfluence ? "sim" : "nao"}
              onChange={(v) => set("decisionInfluence", v === "sim")}
            />
          </div>
          <div>
            <Label>Você já é cliente da Lucrattiva?</Label>
            <SegmentedChoice
              options={[
                { value: "SIM", label: "Sim" },
                { value: "NAO", label: "Não" },
                { value: "NAO_SEI", label: "Não sei" },
              ]}
              value={form.isExistingClient}
              onChange={(v) => set("isExistingClient", v)}
            />
          </div>
          <div>
            <Label>Gostaria de receber informações sobre um diagnóstico da sua operação?</Label>
            <SegmentedChoice
              options={[
                { value: "SIM", label: "Sim" },
                { value: "QUERO_SABER_MAIS", label: "Quero saber mais" },
                { value: "NAO", label: "Não neste momento" },
              ]}
              value={form.diagnosticInterest}
              onChange={(v) => set("diagnosticInterest", v)}
            />
          </div>
        </div>

        <div className="space-y-3 border-t border-border pt-4 text-sm">
          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={operationalConsent}
              onChange={(e) => setOperationalConsent(e.target.checked)}
            />
            <span className="text-muted">
              Autorizo o uso destes dados para meu credenciamento, comunicação sobre este evento e lembretes. *
            </span>
          </label>
          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={form.marketingConsent}
              onChange={(e) => set("marketingConsent", e.target.checked)}
            />
            <span className="text-muted">Quero receber comunicações futuras da Lucrattiva.</span>
          </label>
        </div>

        {error && <p className="text-sm text-red">{error}</p>}
        <Button type="submit" disabled={status === "sending"} className="w-full">
          {status === "sending" ? "Enviando..." : ctaLabel}
        </Button>
      </form>
    </Card>
  );
}
