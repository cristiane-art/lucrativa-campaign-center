"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SerializedCampaign } from "@/lib/serialize";
import type { CompletenessResult } from "@/lib/completeness";
import { Card, CardHeader, Button, Badge } from "@/components/ui";
import { ChatPanel } from "@/components/ChatPanel";
import { StepEvento } from "./StepEvento";
import { StepObjetivo } from "./StepObjetivo";
import { StepPublico } from "./StepPublico";
import { StepConteudo } from "./StepConteudo";
import { StepMeta } from "./StepMeta";
import { StepOrcamento } from "./StepOrcamento";
import { StepCanais } from "./StepCanais";
import { StepRevisao } from "./StepRevisao";

const STEPS = [
  { key: "evento", label: "Evento" },
  { key: "objetivo", label: "Objetivo" },
  { key: "publico", label: "Público" },
  { key: "conteudo", label: "Conteúdo" },
  { key: "meta", label: "Meta" },
  { key: "orcamento", label: "Orçamento" },
  { key: "canais", label: "Canais e ativos" },
  { key: "revisao", label: "Revisão" },
] as const;

export function CampaignDiscovery({
  campaign: initial,
  completeness: initialCompleteness,
}: {
  campaign: SerializedCampaign;
  completeness: CompletenessResult;
}) {
  const router = useRouter();
  const [campaign, setCampaign] = useState(initial);
  const [completeness, setCompleteness] = useState(initialCompleteness);
  const [stepIndex, setStepIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const step = STEPS[stepIndex];
  const progressPct = Math.round(((stepIndex + 1) / STEPS.length) * 100);

  async function patch(partial: Record<string, unknown>) {
    setSaving(true);
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(partial),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha ao salvar");
      setCampaign(data.campaign);
      setCompleteness(data.completeness);
      return data.campaign as SerializedCampaign;
    } finally {
      setSaving(false);
    }
  }

  async function confirmCampaign() {
    setConfirming(true);
    setConfirmError(null);
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}/confirm`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha ao confirmar campanha");
      router.push(`/campanhas/${campaign.id}`);
      router.refresh();
    } catch (err) {
      setConfirmError((err as Error).message);
    } finally {
      setConfirming(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <p className="text-sm font-medium uppercase tracking-wide text-amber">Assistente de configuração de campanha</p>
        <h1 className="font-display text-2xl font-semibold text-accent-strong">{campaign.name || "Nova campanha"}</h1>
        <p className="mt-1 text-sm text-muted">
          Vou entender o evento primeiro, depois montar a estratégia. Nenhum dado é assumido sem você confirmar.
        </p>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-2">
          <div className="h-full bg-accent transition-all" style={{ width: `${progressPct}%` }} />
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {STEPS.map((s, i) => (
            <button
              key={s.key}
              onClick={() => setStepIndex(i)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                i === stepIndex ? "bg-accent text-white" : "bg-surface-2 text-muted hover:text-ink"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Card>
          <CardHeader
            title={step.label}
            subtitle={saving ? "Salvando..." : undefined}
            action={
              completeness.missing.length > 0 ? (
                <Badge tone="amber">{completeness.missing.length} pendência(s)</Badge>
              ) : (
                <Badge tone="accent">Briefing completo</Badge>
              )
            }
          />
          <div className="p-5">
            {step.key === "evento" && <StepEvento campaign={campaign} patch={patch} />}
            {step.key === "objetivo" && <StepObjetivo campaign={campaign} patch={patch} />}
            {step.key === "publico" && <StepPublico campaign={campaign} patch={patch} />}
            {step.key === "conteudo" && <StepConteudo campaign={campaign} patch={patch} />}
            {step.key === "meta" && <StepMeta campaign={campaign} patch={patch} />}
            {step.key === "orcamento" && <StepOrcamento campaign={campaign} patch={patch} />}
            {step.key === "canais" && <StepCanais campaign={campaign} patch={patch} />}
            {step.key === "revisao" && (
              <StepRevisao
                campaign={campaign}
                completeness={completeness}
                onConfirm={confirmCampaign}
                confirming={confirming}
                error={confirmError}
                goToStep={(key) => setStepIndex(STEPS.findIndex((s) => s.key === key))}
              />
            )}

            <div className="mt-6 flex justify-between border-t border-border pt-4">
              <Button variant="secondary" disabled={stepIndex === 0} onClick={() => setStepIndex((i) => Math.max(0, i - 1))}>
                Voltar
              </Button>
              {step.key !== "revisao" && (
                <Button onClick={() => setStepIndex((i) => Math.min(STEPS.length - 1, i + 1))}>Continuar</Button>
              )}
            </div>
          </div>
        </Card>

        <div className="h-[640px]">
          <ChatPanel
            campaignId={campaign.id}
            onCampaignUpdate={(c) => {
              setCampaign(c);
              fetch(`/api/campaigns/${campaign.id}`)
                .then((r) => r.json())
                .then((d) => setCompleteness(d.completeness));
            }}
          />
        </div>
      </div>
    </main>
  );
}
