import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { safeJson, jsonError } from "@/lib/api";
import { logActivity } from "@/lib/activityLog";

// Público de propósito (fora do matcher do middleware) — é o link que o
// participante recebe por WhatsApp pra confirmar presença, sem precisar de
// login nenhum. Segurança vem do leadId ser um cuid longo e imprevisível,
// mesmo padrão já usado em /inscricao/[id] e /api/inscricao/[id]/calendar.ics.
export async function POST(req: Request, { params }: { params: Promise<{ leadId: string }> }) {
  const { leadId } = await params;
  const body = await safeJson<{ action?: "confirm" | "decline" }>(req);
  if (body.action !== "confirm" && body.action !== "decline") {
    return jsonError('action deve ser "confirm" ou "decline"');
  }

  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead) return jsonError("Inscrição não encontrada", 404);

  const registration = await db.registration.findFirst({
    where: { leadId },
    orderBy: { createdAt: "desc" },
  });
  if (!registration) return jsonError("Inscrição não encontrada", 404);

  const newStatus = body.action === "confirm" ? "CONFIRMED" : "CANCELLED";
  await db.registration.update({ where: { id: registration.id }, data: { status: newStatus } });

  await logActivity(
    lead.campaignId,
    "participante",
    `${lead.name} ${body.action === "confirm" ? "confirmou presença" : "avisou que não vai poder ir"}`,
    { leadId }
  );

  return NextResponse.json({ status: newStatus });
}
