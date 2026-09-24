import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { safeJson, jsonError } from "@/lib/api";
import { logActivity } from "@/lib/activityLog";

// Credenciamento no dia do evento. Recebe qualquer identificador que a
// equipe tenha à mão — código do participante, telefone ou nome — hoje
// digitado à mão, mas a mesma rota já serve para quando um leitor de QR
// Code passar a chamar isto com o participant_code lido (seção "QR Code /
// credencial" do briefing).
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: campaignId } = await params;
  const body = await safeJson<{ query: string }>(req);
  const query = body.query?.trim();
  if (!query) return jsonError("Informe o código, telefone ou nome do participante");

  const lead = await db.lead.findFirst({
    where: {
      campaignId,
      OR: [
        { participantCode: { equals: query } },
        { phone: { equals: query } },
        { email: { equals: query } },
        { name: { contains: query } },
      ],
    },
  });

  if (!lead) return jsonError("Nenhum participante encontrado com esse dado", 404);

  const registration = await db.registration.findFirst({
    where: { campaignId, leadId: lead.id },
    orderBy: { createdAt: "desc" },
  });
  if (!registration) return jsonError(`${lead.name} não tem inscrição registrada nesta campanha`, 404);

  if (registration.status === "CHECKED_IN") {
    return NextResponse.json({ lead, registration, alreadyCheckedIn: true });
  }

  const updated = await db.registration.update({
    where: { id: registration.id },
    data: { status: "CHECKED_IN", checkedInAt: new Date() },
  });
  await db.lead.update({ where: { id: lead.id }, data: { status: "ATTENDED" } });

  await logActivity(campaignId, "usuario", `Check-in: ${lead.name}`, { leadId: lead.id, registrationId: registration.id });

  return NextResponse.json({ lead, registration: updated, alreadyCheckedIn: false });
}
