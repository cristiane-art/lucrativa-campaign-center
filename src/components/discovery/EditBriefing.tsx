"use client";

import { useState } from "react";
import Link from "next/link";
import type { SerializedCampaign } from "@/lib/serialize";
import { Card, CardHeader, Badge } from "@/components/ui";
import { StepEvento } from "./StepEvento";
import { StepObjetivo } from "./StepObjetivo";
import { StepPublico } from "./StepPublico";
import { StepConteudo } from "./StepConteudo";
import { StepMeta } from "./StepMeta";
import { StepOrcamento } from "./StepOrcamento";
import { StepCanais } from "./StepCanais";

export function EditBriefing({ campaign: initial }: { campaign: SerializedCampaign }) {
  const [campaign, setCampaign] = useState(initial);

  async function patch(partial: Record<string, unknown>) {
    const res = await fetch(`/api/campaigns/${campaign.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(partial),
    });
    const data = await res.json();
    if (res.ok) setCampaign(data.campaign);
    return data.campaign as SerializedCampaign;
  }

  const sections = [
    { title: "Evento", node: <StepEvento campaign={campaign} patch={patch} /> },
    { title: "Objetivo", node: <StepObjetivo campaign={campaign} patch={patch} /> },
    { title: "Público", node: <StepPublico campaign={campaign} patch={patch} /> },
    { title: "Conteúdo", node: <StepConteudo campaign={campaign} patch={patch} /> },
    { title: "Meta", node: <StepMeta campaign={campaign} patch={patch} /> },
    { title: "Orçamento", node: <StepOrcamento campaign={campaign} patch={patch} /> },
    { title: "Canais e ativos", node: <StepCanais campaign={campaign} patch={patch} /> },
  ];

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href={`/campanhas/${campaign.id}`} className="text-xs font-medium uppercase tracking-wide text-amber hover:underline">
            ← Voltar ao painel
          </Link>
          <h1 className="font-display text-2xl font-semibold text-accent-strong">Editar briefing — {campaign.name}</h1>
        </div>
        <Badge tone="accent">Alterações salvas automaticamente</Badge>
      </div>

      <div className="space-y-6">
        {sections.map((s) => (
          <Card key={s.title}>
            <CardHeader title={s.title} />
            <div className="p-5">{s.node}</div>
          </Card>
        ))}
      </div>
    </main>
  );
}
