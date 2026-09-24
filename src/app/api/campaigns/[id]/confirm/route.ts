import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { confirmAndRunCampaign } from "@/agents/orchestrator";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const result = await confirmAndRunCampaign(id);
    return NextResponse.json({ result });
  } catch (err) {
    return jsonError((err as Error).message, 400);
  }
}
