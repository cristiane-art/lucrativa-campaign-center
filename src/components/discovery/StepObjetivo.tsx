"use client";

import { Chip, Label } from "@/components/ui";
import { PRIMARY_OBJECTIVES, PRIMARY_OBJECTIVE_LABELS } from "@/lib/types";
import type { StepProps } from "./types";

export function StepObjetivo({ campaign, patch }: StepProps) {
  function toggleSecondary(obj: string) {
    const set = new Set(campaign.secondaryObjectives);
    if (set.has(obj)) set.delete(obj);
    else set.add(obj);
    patch({ secondaryObjectives: Array.from(set) });
  }

  return (
    <div className="space-y-5">
      <div>
        <Label>Qual desses é o objetivo PRINCIPAL deste evento/campanha?</Label>
        <div className="flex flex-wrap gap-2">
          {PRIMARY_OBJECTIVES.map((obj) => (
            <Chip
              key={obj}
              label={PRIMARY_OBJECTIVE_LABELS[obj]}
              selected={campaign.primaryObjective === obj}
              onClick={() => patch({ primaryObjective: obj })}
            />
          ))}
        </div>
      </div>

      <div>
        <Label>Outros objetivos secundários (opcional, pode marcar mais de um)</Label>
        <div className="flex flex-wrap gap-2">
          {PRIMARY_OBJECTIVES.filter((o) => o !== campaign.primaryObjective).map((obj) => (
            <Chip
              key={obj}
              label={PRIMARY_OBJECTIVE_LABELS[obj]}
              selected={campaign.secondaryObjectives.includes(obj)}
              onClick={() => toggleSecondary(obj)}
            />
          ))}
        </div>
      </div>

      {!campaign.primaryObjective && (
        <p className="rounded-lg bg-amber-soft px-3 py-2 text-sm text-amber">
          Sem problema se ainda não tiver certeza — pode conversar com o copiloto ao lado que ele ajuda a decidir com base no
          que você descrever.
        </p>
      )}
    </div>
  );
}
