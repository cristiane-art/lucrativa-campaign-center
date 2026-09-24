import Link from "next/link";
import { db } from "@/lib/db";
import { getOrCreateDefaultClient } from "@/lib/tenant";
import { Card, Badge, Button } from "@/components/ui";
import { BRAND } from "@/lib/brand";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  DISCOVERY: "Configurando",
  PLANNING: "Planejando",
  ACTIVE: "Ativa",
  PAUSED: "Pausada",
  COMPLETED: "Concluída",
  CANCELLED: "Cancelada",
};

const STATUS_TONE: Record<string, "neutral" | "accent" | "amber" | "red" | "muted"> = {
  DISCOVERY: "muted",
  PLANNING: "amber",
  ACTIVE: "accent",
  PAUSED: "amber",
  COMPLETED: "neutral",
  CANCELLED: "red",
};

export default async function CampaignsPage() {
  const client = await getOrCreateDefaultClient();
  const campaigns = await db.campaign.findMany({
    where: { clientId: client.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-amber">{BRAND.fullName}</p>
          <h1 className="font-display text-3xl font-semibold text-accent-strong">Central de Campanhas</h1>
        </div>
        <Link href="/campanhas/nova">
          <Button>+ Criar campanha</Button>
        </Link>
      </header>

      {campaigns.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-muted">Nenhuma campanha ainda. Comece descrevendo o que você quer divulgar.</p>
          <Link href="/campanhas/nova" className="mt-4 inline-block">
            <Button>Criar primeira campanha</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {campaigns.map((c) => (
            <Link key={c.id} href={`/campanhas/${c.id}`}>
              <Card className="h-full p-5 transition-shadow hover:shadow-md">
                <div className="mb-2 flex items-center justify-between">
                  <Badge tone={STATUS_TONE[c.status]}>{STATUS_LABEL[c.status] ?? c.status}</Badge>
                  <span className="text-xs uppercase tracking-wide text-muted">{c.campaignType}</span>
                </div>
                <h2 className="font-display text-lg font-semibold text-ink">{c.name}</h2>
                {c.eventDate && (
                  <p className="mt-1 text-sm text-muted">
                    {new Date(c.eventDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
                  </p>
                )}
                {c.audience && <p className="mt-2 line-clamp-2 text-sm text-muted">{c.audience}</p>}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
