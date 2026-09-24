import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { RegistrationForm } from "@/components/RegistrationForm";
import { BRAND } from "@/lib/brand";
import { parseBriefingExtra } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function InscricaoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = await db.campaign.findUnique({ where: { id } });
  if (!campaign) notFound();

  const extra = parseBriefingExtra(campaign.briefingExtra);

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-12">
      <p className="text-center text-sm font-medium uppercase tracking-wide text-amber">{BRAND.fullName}</p>
      <h1 className="mt-2 text-center font-display text-3xl font-semibold text-accent-strong">{campaign.name}</h1>

      <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-muted">
        {campaign.eventDate && (
          <span>📅 {new Date(campaign.eventDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</span>
        )}
        {campaign.eventTime && <span>🕐 {campaign.eventTime}</span>}
        {campaign.eventLocation && <span>📍 {campaign.eventLocation}</span>}
      </div>

      {campaign.valueProposition && <p className="mt-6 text-center text-ink">{campaign.valueProposition}</p>}
      {extra.motivationProblem && <p className="mt-2 text-center text-sm text-muted">{extra.motivationProblem}</p>}

      {extra.topics.length > 0 && (
        <div className="mt-6">
          <p className="mb-2 text-center text-sm font-medium text-ink">O que você vai encontrar:</p>
          <ul className="mx-auto max-w-md space-y-1 text-sm text-muted">
            {extra.topics.map((t) => (
              <li key={t} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-amber" /> {t}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mx-auto mt-10 max-w-md">
        <RegistrationForm campaignId={campaign.id} ctaLabel={campaign.cta || "Inscrever-se"} />
      </div>
    </main>
  );
}
