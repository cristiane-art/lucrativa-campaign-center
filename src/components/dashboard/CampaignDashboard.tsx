"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { SerializedCampaign } from "@/lib/serialize";
import { Card, CardHeader, Button } from "@/components/ui";
import { ChatPanel } from "@/components/ChatPanel";
import { DashboardNav } from "./DashboardNav";
import { FunnelChart } from "./FunnelChart";
import { ApprovalsPanel } from "./ApprovalsPanel";
import { TasksPanel } from "./TasksPanel";
import { ActivityLogPanel } from "./ActivityLogPanel";

interface Counts {
  leads: number;
  registered: number;
  confirmed: number;
  attended: number;
}

const STAGE_LABELS: Record<string, string> = {
  research: "Pesquisa",
  strategy: "Estratégia",
  content: "Conteúdo",
  creative: "Criativo",
  tracking: "Rastreamento",
};

export function CampaignDashboard({ campaign: initial }: { campaign: SerializedCampaign }) {
  const [campaign, setCampaign] = useState(initial);
  const [counts, setCounts] = useState<Counts>({ leads: 0, registered: 0, confirmed: 0, attended: 0 });
  const [loading, setLoading] = useState(true);
  const [runningAgents, setRunningAgents] = useState(false);
  const [agentsResult, setAgentsResult] = useState<string | null>(null);

  async function runAgents() {
    if (!confirm("Rodar Pesquisa → Estratégia → Conteúdo → Criativo → Rastreamento de novo para esta campanha?")) return;
    setRunningAgents(true);
    setAgentsResult(null);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 58_000);
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}/confirm`, { method: "POST", signal: controller.signal });
      const data = await res.json().catch(() => ({ error: `Resposta inesperada do servidor (status ${res.status})` }));
      if (!res.ok) {
        setAgentsResult(`Erro: ${data.error ?? res.status}`);
        return;
      }
      const stages = data.result.stages as Record<string, string>;
      const summary = Object.entries(stages)
        .map(([k, v]) => `${STAGE_LABELS[k] ?? k}: ${v === "ok" ? "✓" : v === "skipped" ? "pulado" : "falhou"}`)
        .join(" · ");
      setAgentsResult(summary);
    } catch (err) {
      const isAbort = err instanceof DOMException && err.name === "AbortError";
      setAgentsResult(
        isAbort
          ? "Deu timeout (passou de 58s). Isso pode acontecer mesmo assim — confira a aba Conteúdo, o pipeline pode ter terminado no servidor mesmo sem a resposta chegar aqui."
          : `Erro: ${(err as Error).message}`
      );
    } finally {
      clearTimeout(timeout);
      setRunningAgents(false);
    }
  }

  async function loadCounts() {
    const res = await fetch(`/api/campaigns/${campaign.id}/leads`);
    const data = await res.json();
    const leads = data.leads as Array<{ status: string }>;
    setCounts({
      leads: leads.length,
      registered: leads.filter((l) => ["REGISTERED", "CONFIRMED", "ATTENDED"].includes(l.status)).length,
      confirmed: leads.filter((l) => ["CONFIRMED", "ATTENDED"].includes(l.status)).length,
      attended: leads.filter((l) => l.status === "ATTENDED").length,
    });
  }

  useEffect(() => {
    loadCounts().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const daysRemaining = campaign.eventDate
    ? Math.ceil((new Date(campaign.eventDate).getTime() - Date.now()) / 86_400_000)
    : null;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <DashboardNav campaignId={campaign.id} campaignName={campaign.name} status={campaign.status} />

      <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatTile label="Evento" value={campaign.eventDate ? new Date(campaign.eventDate).toLocaleDateString("pt-BR") : "—"} />
            <StatTile label="Dias restantes" value={daysRemaining != null ? String(Math.max(0, daysRemaining)) : "—"} />
            <StatTile label="Meta" value={campaign.targetResult ? `${campaign.targetResult} ${campaign.targetMetricLabel ?? ""}` : "não definida"} />
            <StatTile label="Resultado atual" value={loading ? "..." : String(counts.confirmed)} />
          </div>

          <Card>
            <CardHeader title="Funil da campanha" subtitle="Real até agora — sem estimativas" />
            <div className="p-5">
              <FunnelChart counts={counts} />
            </div>
          </Card>

          <TasksPanel campaignId={campaign.id} />
          <ApprovalsPanel campaignId={campaign.id} />
          <ActivityLogPanel campaignId={campaign.id} />
        </div>

        <div className="space-y-6">
          <div className="h-[520px]">
            <ChatPanel
              campaignId={campaign.id}
              onCampaignUpdate={setCampaign}
              quickActions={[
                { label: "Quantas pessoas confirmaram?", message: "Quantas pessoas confirmaram até agora?" },
                { label: "Qual canal está performando melhor?", message: "Qual canal está trazendo mais inscrições?" },
                { label: "Ver pendências", message: "O que ainda precisa ser feito nesta campanha?" },
              ]}
            />
          </div>
          <Card className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted">Config rápida</p>
            <Link href={`/campanhas/${campaign.id}/editar`}>
              <Button variant="secondary" size="sm" className="mt-2 w-full">
                Editar briefing da campanha
              </Button>
            </Link>
            <Button
              variant="secondary"
              size="sm"
              className="mt-2 w-full"
              onClick={runAgents}
              disabled={runningAgents}
            >
              {runningAgents ? "Rodando agentes..." : "Rodar agentes de IA (Pesquisa/Estratégia/Conteúdo)"}
            </Button>
            {agentsResult && <p className="mt-2 text-xs text-muted">{agentsResult}</p>}
          </Card>
        </div>
      </div>
    </main>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 font-display text-xl font-semibold text-accent-strong">{value}</p>
    </Card>
  );
}
