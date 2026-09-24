import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const approvals = await db.approval.findMany({
    where: { campaignId: id, status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ approvals });
}
