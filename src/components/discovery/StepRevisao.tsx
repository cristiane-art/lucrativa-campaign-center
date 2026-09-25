"use client";

import { Button, Badge } from "@/components/ui";
import { fieldLabel, type CompletenessResult } from "@/lib/completeness";
import { PRIMARY_OBJECTIVE_LABELS } from "@/lib/types";
import type { SerializedCampaign } from "@/lib/serialize";

const FIELD_TO_STEP: Record<string, string> = {
  name: "evento",
  eventDate: "evento",
  eventFormat: "evento",
  eventLocation: "evento",
  eventPrice: "evento",
  eventCapacity: "evento",
  primaryObjective: "objetivo",
  audience: "publico",
  region: "publico",
  targetResult: "meta",
  budget: "orcamento",
  channels: "canais",
  cta: "canais",
};

export function StepRevisao({
  campaign,
  completeness,
  onConfirm,
  confirming,
  error,
  goToStep,
}: {
  campaign: SerializedCampaign;
  completeness: CompletenessResult;
  onConfirm: () => void;
  confirming: boolean;
  error: string | null;
  goToStep: (key: string) => void;
}) {
  const row = (label: string, value: string | null | undefined) => (
    <div className="flex justify-between gap-4 border-b border-border py-2 text-sm">
      <span className="text-muted">{label}</span>
      <span className="text-right text-ink">{value || <em className="text-muted">não informado</em>}</span>
    </div>
  );

  return (
    <div className="space-y-5">
      <h4 className="font-display text-base font-semibold text-accent-strong">Resumo da campanha</h4>
      <div>
        {row("Evento", campaign.name)}
        {row("Data", campaign.eventDate ? new Date(campaign.eventDate).toLocaleDateString("pt-BR") : null)}
        {row("Local", campaign.eventLocation)}
        {row("Público", campaign.audience)}
        {row("Objetivo principal", campaign.primaryObjective ? PRIMARY_OBJECTIVE_LABELS[campaign.primaryObjective as keyof typeof PRIMARY_OBJECTIVE_LABELS] : null)}
        {row("Meta", campaign.targetResult ? `${campaign.targetResult} ${campaign.targetMetricLabel ?? ""}` : null)}
        {row("Orçamento", campaign.budgetRangeLabel)}
        {row("Canais", campaign.channels.join(", "))}
        {row("CTA", campaign.cta)}
      </div>

      {completeness.missing.length > 0 ? (
        <div className="rounded-lg bg-[color-mix(in_srgb,var(--red)_10%,transparent)] p-3">
          <p className="mb-2 text-sm font-medium text-red">Ainda faltam informações obrigatórias:</p>
          <div className="flex flex-wrap gap-2">
            {completeness.missing.map((f) => (
              <button key={f} onClick={() => goToStep(FIELD_TO_STEP[f] ?? "evento")}>
                <Badge tone="red">{fieldLabel(f)}</Badge>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-lg bg-accent-soft p-3 text-sm text-accent-strong">
          Está tudo certo para confirmar. Ao confirmar, os agentes de pesquisa, estratégia, conteúdo e rastreamento vão rodar
          automaticamente.
        </div>
      )}

      {completeness.recommended.length > 0 && (
        <p className="text-xs text-muted">
          Marcado como &ldquo;ainda não sei&rdquo;: {completeness.recommended.map(fieldLabel).join(", ")} — podemos definir isso
          depois.
        </p>
      )}

      {error && <div className="rounded-lg bg-[color-mix(in_srgb,var(--red)_10%,transparent)] px-3 py-2 text-sm text-red">{error}</div>}

      <Button onClick={onConfirm} disabled={completeness.missing.length > 0 || confirming} className="w-full">
        {confirming ? "Confirmando e executando agentes..." : "Confirmar e criar campanha"}
      </Button>
    </div>
  );
}
