"use client";

import { useState } from "react";
import { Label, Input, Button } from "@/components/ui";
import type { StepProps } from "./types";
import { toggleUnknownField } from "./types";

export function StepMeta({ campaign, patch }: StepProps) {
  const [value, setValue] = useState(campaign.targetResult?.toString() ?? "");
  const [label, setLabel] = useState(campaign.targetMetricLabel ?? "");
  const unknown = campaign.briefingExtra.unknownFields?.includes("targetResult") ?? false;

  return (
    <div className="space-y-5">
      <Label>Você já possui uma meta? (ex: 150 pessoas presentes, 200 inscrições, 50 leads)</Label>
      {unknown ? (
        <p className="rounded-lg bg-amber-soft px-3 py-2 text-sm text-amber">
          Sem problema. Posso ajudar a definir uma meta depois que entendermos o tamanho do evento e o público.
        </p>
      ) : (
        <div className="flex gap-2">
          <Input type="number" placeholder="número" value={value} onChange={(e) => setValue(e.target.value)} className="w-32" />
          <Input placeholder="unidade (ex: inscrições, leads)" value={label} onChange={(e) => setLabel(e.target.value)} className="flex-1" />
          <Button
            variant="secondary"
            onClick={() => value && patch({ targetResult: Number(value), targetMetricLabel: label })}
          >
            Salvar
          </Button>
        </div>
      )}
      <label className="flex items-center gap-1.5 text-sm text-muted">
        <input
          type="checkbox"
          checked={unknown}
          onChange={(e) => patch({ targetResult: e.target.checked ? null : campaign.targetResult, ...toggleUnknownField(campaign, "targetResult", e.target.checked) })}
        />
        ainda não sei
      </label>

      {campaign.eventCapacity && campaign.targetResult && campaign.targetResult > campaign.eventCapacity && (
        <div className="rounded-lg bg-red/10 px-3 py-2 text-sm text-red">
          ⚠️ Existe uma inconsistência: a meta ({campaign.targetResult}) é maior que a capacidade do evento (
          {campaign.eventCapacity}). Ajuste um dos dois quando puder.
        </div>
      )}
    </div>
  );
}
