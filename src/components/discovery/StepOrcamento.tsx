"use client";

import { Chip, Label } from "@/components/ui";
import { BUDGET_RANGES } from "@/lib/types";
import type { StepProps } from "./types";

const RANGE_LABELS: Record<string, string> = {
  SEM_ORCAMENTO_PAGO: "Sem orçamento pago",
  ATE_300: "Até R$ 300",
  "300_500": "R$ 300–500",
  "500_1000": "R$ 500–1.000",
  "1000_2000": "R$ 1.000–2.000",
  "2000_MAIS": "R$ 2.000+",
  AINDA_NAO_DEFINIDO: "Ainda não definido",
};

export function StepOrcamento({ campaign, patch }: StepProps) {
  return (
    <div className="space-y-5">
      <div>
        <Label>Existe orçamento para divulgação?</Label>
        <div className="flex flex-wrap gap-2">
          {BUDGET_RANGES.map((r) => (
            <Chip key={r} label={RANGE_LABELS[r]} selected={campaign.budgetRangeLabel === r} onClick={() => patch({ budgetRangeLabel: r })} />
          ))}
        </div>
      </div>

      {campaign.budgetRangeLabel && campaign.budgetRangeLabel !== "SEM_ORCAMENTO_PAGO" && campaign.budgetRangeLabel !== "AINDA_NAO_DEFINIDO" && (
        <p className="text-sm text-muted">
          Esse orçamento é só para anúncios ou também inclui produção/material físico/parceiros? Você pode detalhar isso
          conversando com o copiloto ao lado, ou ajustar depois no painel financeiro da campanha.
        </p>
      )}
    </div>
  );
}
