"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui";
import { BRAND } from "@/lib/brand";

const STATUS_LABEL: Record<string, string> = {
  PLANNING: "Planejando",
  ACTIVE: "Ativa",
  PAUSED: "Pausada",
  COMPLETED: "Concluída",
  CANCELLED: "Cancelada",
};

export function DashboardNav({ campaignId, campaignName, status }: { campaignId: string; campaignName: string; status: string }) {
  const pathname = usePathname();
  const tabs = [
    { href: `/campanhas/${campaignId}`, label: "Visão geral" },
    { href: `/campanhas/${campaignId}/conteudo`, label: "Conteúdo" },
    { href: `/campanhas/${campaignId}/leads`, label: "Leads" },
    { href: `/campanhas/${campaignId}/tracking`, label: "Divulgação" },
    { href: `/campanhas/${campaignId}/tarefas`, label: "Tarefas" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <Link href="/campanhas" className="text-xs font-medium uppercase tracking-wide text-amber hover:underline">
            ← {BRAND.fullName} · Central de Campanhas
          </Link>
          <h1 className="font-display text-2xl font-semibold text-accent-strong">{campaignName}</h1>
        </div>
        <Badge tone="accent">{STATUS_LABEL[status] ?? status}</Badge>
      </div>
      <nav className="mt-4 flex gap-1 border-b border-border">
        {tabs.map((t) => {
          const active = pathname === t.href;
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${
                active ? "border-accent text-accent-strong" : "border-transparent text-muted hover:text-ink"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
