"use client";

import { useEffect, useState } from "react";
import { DashboardNav } from "./DashboardNav";
import { Card, CardHeader, Badge, Button } from "@/components/ui";

interface TrackingLink {
  id: string;
  source: string;
  medium: string;
  destinationUrl: string;
  shortCode: string;
  clicks: number;
}

interface QrCode {
  id: string;
  label: string;
  physicalAsset: string | null;
  scans: number;
  conversions: number;
}

export function TrackingBoard({ campaignId, campaignName, status }: { campaignId: string; campaignName: string; status: string }) {
  const [links, setLinks] = useState<TrackingLink[]>([]);
  const [qrCodes, setQrCodes] = useState<QrCode[]>([]);
  const [baseUrl, setBaseUrl] = useState("");

  useEffect(() => {
    setBaseUrl(window.location.origin);
    fetch(`/api/campaigns/${campaignId}/tracking`)
      .then((r) => r.json())
      .then((d) => {
        setLinks(d.links);
        setQrCodes(d.qrCodes);
      });
  }, [campaignId]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <DashboardNav campaignId={campaignId} campaignName={campaignName} status={status} />

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Links rastreáveis (UTM)" subtitle={`${links.length} link(s)`} />
          <div className="divide-y divide-border">
            {links.length === 0 && <p className="p-4 text-sm text-muted">Nenhum link gerado ainda — confirme a campanha para gerar.</p>}
            {links.map((l) => (
              <div key={l.id} className="p-4">
                <div className="flex items-center justify-between">
                  <Badge tone="accent">{l.source}</Badge>
                  <span className="text-sm font-medium text-accent-strong">{l.clicks} cliques</span>
                </div>
                <p className="mt-1 break-all text-xs text-muted">{baseUrl}/r/{l.shortCode}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="QR Codes" subtitle={`${qrCodes.length} código(s)`} />
          <div className="grid grid-cols-2 gap-4 p-4">
            {qrCodes.length === 0 && <p className="text-sm text-muted">Nenhum QR Code gerado (só para canais físicos).</p>}
            {qrCodes.map((q) => (
              <Card key={q.id} className="p-3 text-center">
                <p className="font-display text-sm font-semibold text-accent-strong">{q.label}</p>
                <p className="text-xs text-muted">{q.physicalAsset}</p>
                <img src={`/api/qrcodes/${q.id}/png`} alt={q.label} className="mx-auto my-2 h-28 w-28" />
                <p className="text-xs text-muted">
                  {q.scans} scans · {q.conversions} conversões
                </p>
                <a href={`/api/qrcodes/${q.id}/png`} download>
                  <Button size="sm" variant="secondary" className="mt-2 w-full">
                    Baixar PNG
                  </Button>
                </a>
              </Card>
            ))}
          </div>
        </Card>
      </div>
    </main>
  );
}
