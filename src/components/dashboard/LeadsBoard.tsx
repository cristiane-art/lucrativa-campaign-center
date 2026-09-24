"use client";

import { useEffect, useState } from "react";
import { DashboardNav } from "./DashboardNav";
import { Card, Badge, Button, Input } from "@/components/ui";

interface Lead {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  city: string | null;
  source: string | null;
  status: string;
}

const PIPELINE = ["NEW", "INTERESTED", "REGISTERED", "CONFIRMED", "ATTENDED"];
const STATUS_LABEL: Record<string, string> = {
  NEW: "Novo",
  INTERESTED: "Interessado",
  REGISTERED: "Inscrito",
  CONFIRMED: "Confirmado",
  ATTENDED: "Presente",
  OPPORTUNITY: "Oportunidade",
  CUSTOMER: "Cliente",
};

export function LeadsBoard({ campaignId, campaignName, status }: { campaignId: string; campaignName: string; status: string }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [form, setForm] = useState({ name: "", phone: "", city: "" });

  async function load() {
    const res = await fetch(`/api/campaigns/${campaignId}/leads`);
    const data = await res.json();
    setLeads(data.leads);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId]);

  async function addLead() {
    if (!form.name.trim()) return;
    await fetch(`/api/campaigns/${campaignId}/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ name: "", phone: "", city: "" });
    load();
  }

  async function advance(id: string, newStatus: string) {
    await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    load();
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <DashboardNav campaignId={campaignId} campaignName={campaignName} status={status} />

      <Card className="mt-6 p-4">
        <p className="mb-2 text-sm font-medium text-ink">Adicionar lead manualmente</p>
        <div className="flex flex-wrap gap-2">
          <Input placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-48" />
          <Input placeholder="Telefone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-40" />
          <Input placeholder="Cidade" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-40" />
          <Button onClick={addLead}>Adicionar</Button>
        </div>
      </Card>

      <div className="mt-6 grid gap-4 md:grid-cols-5">
        {PIPELINE.map((stage) => (
          <div key={stage}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
              {STATUS_LABEL[stage]} ({leads.filter((l) => l.status === stage).length})
            </p>
            <div className="space-y-2">
              {leads
                .filter((l) => l.status === stage)
                .map((l) => (
                  <Card key={l.id} className="p-3">
                    <p className="text-sm font-medium text-ink">{l.name}</p>
                    <p className="text-xs text-muted">{l.phone || l.email || "sem contato"}</p>
                    {l.city && <p className="text-xs text-muted">{l.city}</p>}
                    <div className="mt-2 flex items-center justify-between">
                      <Badge tone="muted">{l.source ?? "—"}</Badge>
                      {PIPELINE.indexOf(stage) < PIPELINE.length - 1 && (
                        <button
                          className="text-xs text-accent hover:underline"
                          onClick={() => advance(l.id, PIPELINE[PIPELINE.indexOf(stage) + 1])}
                        >
                          avançar →
                        </button>
                      )}
                    </div>
                  </Card>
                ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
