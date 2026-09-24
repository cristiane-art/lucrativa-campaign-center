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
