import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { buildEventIcs } from "@/lib/ics";

// Pública de propósito — igual /inscricao, nunca fica atrás da senha do
// dashboard (ver src/middleware.ts, que não intercepta /api/inscricao/*).
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = await db.campaign.findUnique({ where: { id } });
  if (!campaign || !campaign.eventDate) {
    return NextResponse.json({ error: "Evento não encontrado ou sem data definida" }, { status: 404 });
  }

  const ics = buildEventIcs({
    uid: `${campaign.id}@lucrattiva`,
    title: campaign.name,
    description: campaign.landingSubtitle || campaign.valueProposition,
    location: campaign.eventLocation,
    eventDate: campaign.eventDate,
    eventTime: campaign.eventTime,
  });

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="evento.ics"`,
    },
  });
}
