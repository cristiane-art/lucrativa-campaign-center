import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { safeJson, jsonError } from "@/lib/api";
import { logActivity } from "@/lib/activityLog";
import { LEAD_STATUSES } from "@/lib/types";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await safeJson<{ status: string }>(req);
  if (!LEAD_STATUSES.includes(body.status as (typeof LEAD_STATUSES)[number])) {
    return jsonError(`status inválido: ${body.status}`);
  }
  const lead = await db.lead.update({ where: { id }, data: { status: body.status } });
  await logActivity(lead.campaignId, "usuario", `Lead "${lead.name}" -> ${body.status}`, { leadId: lead.id });
  return NextResponse.json({ lead });
}

// Exclusão definitiva do lead (e de qualquer inscrição vinculada) — atende
// pedido de exclusão de dados (LGPD) ou remoção de cadastro de teste.
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lead = await db.lead.findUnique({ where: { id } });
  if (!lead) return jsonError("lead não encontrado", 404);

  await db.$transaction([
    db.registration.deleteMany({ where: { leadId: id } }),
    db.lead.delete({ where: { id } }),
  ]);
  await logActivity(lead.campaignId, "usuario", `Lead "${lead.name}" excluído`, { leadId: id });
  return NextResponse.json({ ok: true });
}
