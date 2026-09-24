import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const items = await db.contentItem.findMany({
    where: { campaignId: id },
    orderBy: [{ scheduledAt: "asc" }, { createdAt: "asc" }],
    include: { creativeAssets: true },
  });
  return NextResponse.json({ items });
}
