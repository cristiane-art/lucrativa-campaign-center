"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, Badge, Button } from "@/components/ui";

interface Task {
  id: string;
  title: string;
  description: string | null;
  type: string;
  status: string;
  priority: string;
  automationLevel: string;
  assignedTo: string;
}

const PRIORITY_TONE: Record<string, "red" | "amber" | "muted"> = { ALTA: "red", MEDIA: "amber", BAIXA: "muted" };

export function TasksPanel({ campaignId }: { campaignId: string }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch(`/api/campaigns/${campaignId}/tasks`);
    const data = await res.json();
    setTasks(data.tasks);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId]);

  async function complete(id: string) {
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "COMPLETED" }),
    });
    load();
  }

  const pending = tasks.filter((t) => t.status !== "COMPLETED" && t.status !== "CANCELLED");

  return (
    <Card>
      <CardHeader title="O que precisamos fazer" subtitle={`${pending.length} tarefa(s) pendente(s)`} />
      <div className="divide-y divide-border">
        {loading && <p className="p-4 text-sm text-muted">Carregando...</p>}
        {!loading && pending.length === 0 && <p className="p-4 text-sm text-muted">Nenhuma pendência agora.</p>}
        {pending.map((t) => (
          <div key={t.id} className="flex items-start justify-between gap-3 p-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-ink">{t.title}</span>
                <Badge tone={PRIORITY_TONE[t.priority] ?? "muted"}>{t.priority}</Badge>
                <Badge tone="muted">{t.assignedTo}</Badge>
              </div>
              {t.description && <p className="mt-1 text-xs text-muted">{t.description}</p>}
            </div>
            <Button size="sm" variant="secondary" onClick={() => complete(t.id)}>
              Concluir
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}
