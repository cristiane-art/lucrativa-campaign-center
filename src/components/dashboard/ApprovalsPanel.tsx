"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, Badge, Button } from "@/components/ui";

interface Approval {
  id: string;
  entityType: string;
  entityId: string;
  level: string;
  summary: string;
  requestedBy: string;
}

export function ApprovalsPanel({ campaignId }: { campaignId: string }) {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch(`/api/campaigns/${campaignId}/approvals`);
    const data = await res.json();
    setApprovals(data.approvals);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId]);

  async function decide(id: string, decision: "APPROVED" | "REJECTED") {
    await fetch(`/api/approvals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision }),
    });
    load();
  }

  return (
    <Card>
      <CardHeader title="Aguardando sua aprovação" subtitle={`${approvals.length} item(ns)`} />
      <div className="divide-y divide-border">
        {!loading && approvals.length === 0 && <p className="p-4 text-sm text-muted">Nada aguardando aprovação.</p>}
        {approvals.map((a) => (
          <div key={a.id} className="flex items-center justify-between gap-3 p-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-ink">{a.summary}</span>
                <Badge tone="amber">{a.level}</Badge>
              </div>
              <p className="mt-0.5 text-xs text-muted">via {a.requestedBy}</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => decide(a.id, "APPROVED")}>
                Aprovar
              </Button>
              <Button size="sm" variant="danger" onClick={() => decide(a.id, "REJECTED")}>
                Rejeitar
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
