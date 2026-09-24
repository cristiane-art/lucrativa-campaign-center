"use client";

import { useEffect, useState } from "react";
import { DashboardNav } from "./DashboardNav";
import { Card, Badge, Button, Input } from "@/components/ui";

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

const STATUS_LABEL: Record<string, string> = {
  TODO: "A fazer",
  IN_PROGRESS: "Em andamento",
  WAITING_APPROVAL: "Aguardando aprovação",
  BLOCKED: "Bloqueada",
  COMPLETED: "Concluída",
  CANCELLED: "Cancelada",
};

const STATUS_TONE: Record<string, "neutral" | "accent" | "amber" | "red" | "muted"> = {
  TODO: "muted",
  IN_PROGRESS: "amber",
  WAITING_APPROVAL: "amber",
  BLOCKED: "red",
  COMPLETED: "accent",
  CANCELLED: "muted",
};

export function TasksBoard({ campaignId, campaignName, status }: { campaignId: string; campaignName: string; status: string }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTitle, setNewTitle] = useState("");

  async function load() {
    const res = await fetch(`/api/campaigns/${campaignId}/tasks`);
    const data = await res.json();
    setTasks(data.tasks);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId]);

  async function addTask() {
    if (!newTitle.trim()) return;
    await fetch(`/api/campaigns/${campaignId}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle }),
    });
    setNewTitle("");
    load();
  }

  async function setStatus(id: string, s: string) {
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: s }),
    });
    load();
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <DashboardNav campaignId={campaignId} campaignName={campaignName} status={status} />

      <Card className="mt-6 p-4">
        <div className="flex gap-2">
          <Input placeholder="Nova tarefa..." value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="flex-1" />
          <Button onClick={addTask}>Adicionar</Button>
        </div>
      </Card>

      <div className="mt-6 space-y-2">
        {tasks.map((t) => (
          <Card key={t.id} className="flex items-center justify-between p-4">
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-sm ${t.status === "COMPLETED" ? "text-muted line-through" : "text-ink"}`}>{t.title}</span>
                <Badge tone={STATUS_TONE[t.status]}>{STATUS_LABEL[t.status]}</Badge>
                <Badge tone="muted">{t.automationLevel}</Badge>
              </div>
              {t.description && <p className="mt-1 text-xs text-muted">{t.description}</p>}
            </div>
            <select
              value={t.status}
              onChange={(e) => setStatus(t.id, e.target.value)}
              className="rounded-lg border border-border bg-surface px-2 py-1 text-xs"
            >
              {Object.entries(STATUS_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </Card>
        ))}
      </div>
    </main>
  );
}
