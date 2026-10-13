import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { BRAND } from "@/lib/brand";
import { ConfirmButtons } from "./ConfirmButtons";

export const dynamic = "force-dynamic";

function formatEventDate(date: Date | null) {
  if (!date) return null;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

export default async function ConfirmarPage({ params }: { params: Promise<{ leadId: string }> }) {
  const { leadId } = await params;
  const lead = await db.lead.findUnique({
    where: { id: leadId },
    include: { campaign: true, registrations: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (!lead) notFound();

  const registration = lead.registrations[0];
  if (!registration) notFound();

  const firstName = lead.name.split(" ")[0];
  const dateLabel = formatEventDate(lead.campaign.eventDate);

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-5 py-16">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber">{BRAND.fullName}</p>
        <h1 className="mt-3 font-display text-2xl font-semibold text-accent-strong">Oi, {firstName}!</h1>
        <p className="mt-3 text-sm text-muted">
          Confirma sua presença em <strong className="text-ink">{lead.campaign.name}</strong>
          {dateLabel && (
            <>
              , dia {dateLabel}
              {lead.campaign.eventTime && ` às ${lead.campaign.eventTime.split(" ")[0]}`}
            </>
          )}
          {lead.campaign.eventLocation && <> — {lead.campaign.eventLocation}</>}?
        </p>

        <ConfirmButtons leadId={lead.id} initialStatus={registration.status} />
      </div>
    </main>
  );
}
