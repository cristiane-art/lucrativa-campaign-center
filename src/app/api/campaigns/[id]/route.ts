import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jsonError, safeJson } from "@/lib/api";
import { CampaignUpdateSchema, updateCampaignFromWizard } from "@/lib/campaignUpdate";
import { checkCampaignCompleteness } from "@/lib/completeness";
import { serializeCampaign } from "@/lib/serialize";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = await db.campaign.findUnique({ where: { id } });
  if (!campaign) return jsonError("Campanha não encontrada", 404);
  const completeness = checkCampaignCompleteness(campaign);
  return NextResponse.json({ campaign: serializeCampaign(campaign), completeness });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const existing = await db.campaign.findUnique({ where: { id } });
  if (!existing) return jsonError("Campanha não encontrada", 404);

  const body = await safeJson<unknown>(req);
  const parsed = CampaignUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(`Dados inválidos: ${parsed.error.issues.map((i) => i.path.join(".") + ": " + i.message).join("; ")}`);
  }

  const campaign = await updateCampaignFromWizard(id, parsed.data);
  const completeness = checkCampaignCompleteness(campaign);
  return NextResponse.json({ campaign: serializeCampaign(campaign), completeness });
}
