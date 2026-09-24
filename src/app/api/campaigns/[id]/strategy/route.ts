import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const plan = await db.strategyPlan.findFirst({ where: { campaignId: id }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ plan });
}
