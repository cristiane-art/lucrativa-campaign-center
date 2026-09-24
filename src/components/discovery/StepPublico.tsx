"use client";

import { useState } from "react";
import { Label, Textarea, Input } from "@/components/ui";
import type { StepProps } from "./types";

export function StepPublico({ campaign, patch }: StepProps) {
  const [audience, setAudience] = useState(campaign.audience ?? "");
  const [region, setRegion] = useState(campaign.region ?? "");
  const [motivation, setMotivation] = useState(campaign.briefingExtra.motivationProblem ?? "");

  return (
    <div className="space-y-5">
      <div>
        <Label>Quem você quer que participe?</Label>
        <Textarea
          rows={3}
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
          onBlur={() => patch({ audience })}
          placeholder="ex: produtores rurais e profissionais do agro"
        />
      </div>

      <div>
        <Label>Existe alguma região/cidade específica que devemos priorizar?</Label>
        <Input value={region} onChange={(e) => setRegion(e.target.value)} onBlur={() => patch({ region })} placeholder="ex: Nova Mutum e região" />
      </div>

      <div>
        <Label>Por que essa pessoa deveria participar? (problema/dúvida/oportunidade que o evento ajuda a resolver)</Label>
        <Textarea
          rows={3}
          value={motivation}
          onChange={(e) => setMotivation(e.target.value)}
          onBlur={() => patch({ briefingExtra: { motivationProblem: motivation } })}
          placeholder="ex: entender como a Reforma Tributária afeta o produtor rural"
        />
      </div>
    </div>
  );
}
