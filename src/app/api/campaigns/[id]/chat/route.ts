import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { safeJson, jsonError } from "@/lib/api";
import { runCampaignChat } from "@/agents/chat";
import { checkCampaignCompleteness } from "@/lib/completeness";
import { serializeCampaign } from "@/lib/serialize";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const messages = await db.chatMessage.findMany({ where: { campaignId: id }, orderBy: { createdAt: "asc" } });
  return NextResponse.json({ messages });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await safeJson<{ message: string }>(req);
  if (!body.message?.trim()) return jsonError("message é obrigatório");

  try {
    const result = await runCampaignChat(id, body.message.trim());
    const completeness = checkCampaignCompleteness(result.campaign);
    return NextResponse.json({ ...result, campaign: serializeCampaign(result.campaign), completeness });
  } catch (err) {
    return jsonError((err as Error).message, 500);
  }
}
