"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader } from "@/components/ui";

interface LogEntry {
  id: string;
  agent: string;
  action: string;
  createdAt: string;
}

const AGENT_LABEL: Record<string, string> = {
  research_agent: "Pesquisa",
  strategy_agent: "Estratégia",
  content_agent: "Conteúdo",
  creative_agent: "Criativo",
  tracking_agent: "Rastreamento",
  task_engine: "Tarefas",
  orchestrator: "Orquestrador",
  chat_copilot: "Copiloto",
  sistema: "Sistema",
  usuario: "Você",
};

export function ActivityLogPanel({ campaignId }: { campaignId: string }) {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    fetch(`/api/campaigns/${campaignId}/activity`)
      .then((r) => r.json())
      .then((d) => setLogs(d.logs));
  }, [campaignId]);

  return (
    <Card>
      <CardHeader title="O que o agente fez" subtitle="Registro de auditoria da campanha" />
      <div className="max-h-72 divide-y divide-border overflow-y-auto">
        {logs.length === 0 && <p className="p-4 text-sm text-muted">Nenhuma atividade registrada ainda.</p>}
        {logs.map((l) => (
          <div key={l.id} className="flex items-start gap-3 px-4 py-2 text-sm">
            <span className="mt-0.5 w-16 shrink-0 text-xs text-muted">
              {new Date(l.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </span>
            <span>
              <strong className="text-accent-strong">{AGENT_LABEL[l.agent] ?? l.agent}</strong> {l.action}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
