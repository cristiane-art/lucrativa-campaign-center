"use client";

import { useEffect, useState } from "react";
import { DashboardNav } from "./DashboardNav";
import { Card, Badge, Button, Textarea } from "@/components/ui";

interface CreativeAsset {
  id: string;
  imageUrl: string | null;
  provider: string;
  status: string;
}

interface ContentItem {
  id: string;
  contentType: string;
  channel: string;
  title: string;
  hook: string | null;
  body: string;
  cta: string | null;
  status: string;
  scheduledAt: string | null;
  rejectionNote: string | null;
  creativeAssets: CreativeAsset[];
}

const FILTERS = [
  { key: "PENDING_APPROVAL", label: "Pendentes" },
  { key: "APPROVED", label: "Aprovados" },
  { key: "SCHEDULED", label: "Agendados" },
  { key: "PUBLISHED", label: "Publicados" },
  { key: "DRAFT", label: "Rascunhos" },
  { key: "REJECTED", label: "Rejeitados" },
  { key: "ALL", label: "Todos" },
];

const STATUS_TONE: Record<string, "neutral" | "accent" | "amber" | "red" | "muted"> = {
  DRAFT: "muted",
  PENDING_APPROVAL: "amber",
  APPROVED: "accent",
  SCHEDULED: "accent",
  PUBLISHED: "accent",
  REJECTED: "red",
  ARCHIVED: "muted",
};

export function ContentBoard({ campaignId, campaignName, status }: { campaignId: string; campaignName: string; status: string }) {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [filter, setFilter] = useState("PENDING_APPROVAL");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");

  async function load() {
    const res = await fetch(`/api/campaigns/${campaignId}/content`);
    const data = await res.json();
    setItems(data.items);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId]);

  async function act(id: string, action: "approve" | "reject") {
    await fetch(`/api/content/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    load();
  }

  async function saveEdit(id: string) {
    await fetch(`/api/content/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: editBody }),
    });
    setEditingId(null);
    load();
  }

  const visible = filter === "ALL" ? items : items.filter((i) => i.status === filter);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <DashboardNav campaignId={campaignId} campaignName={campaignName} status={status} />

      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${
              filter === f.key ? "bg-accent text-white" : "bg-surface-2 text-muted hover:text-ink"
            }`}
          >
            {f.label} {f.key !== "ALL" && `(${items.filter((i) => i.status === f.key).length})`}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.length === 0 && <p className="text-sm text-muted">Nenhum conteúdo nesse status.</p>}
        {visible.map((item) => {
          const asset = item.creativeAssets[0];
          return (
            <Card key={item.id} className="overflow-hidden">
              {asset?.imageUrl && (
                <div className="relative aspect-square w-full bg-surface-2">
                  <img src={asset.imageUrl} alt={item.title} className="h-full w-full object-cover" />
                  {asset.provider === "mock" && (
                    <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white">
                      MOCK
                    </span>
                  )}
                </div>
              )}
              <div className="p-4">
                <div className="mb-2 flex items-center justify-between">
                  <Badge tone={STATUS_TONE[item.status]}>{item.status}</Badge>
                  <span className="text-xs uppercase text-muted">
                    {item.channel} · {item.contentType}
                  </span>
                </div>
                <h3 className="font-display text-sm font-semibold text-ink">{item.title}</h3>
                {editingId === item.id ? (
                  <Textarea rows={5} value={editBody} onChange={(e) => setEditBody(e.target.value)} className="mt-2" />
                ) : (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-muted">{item.body}</p>
                )}
                {item.cta && <p className="mt-2 text-xs font-medium text-accent">CTA: {item.cta}</p>}
                {item.rejectionNote && <p className="mt-2 text-xs text-red">Motivo da rejeição: {item.rejectionNote}</p>}

                <div className="mt-3 flex flex-wrap gap-2">
                  {editingId === item.id ? (
                    <Button size="sm" onClick={() => saveEdit(item.id)}>
                      Salvar
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setEditingId(item.id);
                        setEditBody(item.body);
                      }}
                    >
                      Editar
                    </Button>
                  )}
                  {item.status === "PENDING_APPROVAL" && (
                    <>
                      <Button size="sm" onClick={() => act(item.id, "approve")}>
                        Aprovar
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => act(item.id, "reject")}>
                        Rejeitar
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </main>
  );
}
