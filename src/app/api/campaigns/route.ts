import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOrCreateDefaultClient } from "@/lib/tenant";
import { jsonError, safeJson } from "@/lib/api";
import { CampaignTypeSchema } from "@/lib/types";
import { serializeCampaign } from "@/lib/serialize";

export async function GET() {
  const client = await getOrCreateDefaultClient();
  const campaigns = await db.campaign.findMany({
    where: { clientId: client.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ campaigns: campaigns.map(serializeCampaign) });
}

export async function POST(req: Request) {
  const body = await safeJson<{ name?: string; campaignType?: string }>(req);
  const client = await getOrCreateDefaultClient();

  const campaignType = body.campaignType
    ? CampaignTypeSchema.safeParse(body.campaignType).success
      ? body.campaignType
      : "evento"
    : "evento";

  const campaign = await db.campaign.create({
    data: {
      clientId: client.id,
      name: body.name?.trim() || "Nova campanha",
      campaignType,
      status: "DISCOVERY",
    },
  });

  return NextResponse.json({ campaign: serializeCampaign(campaign) }, { status: 201 });
}
