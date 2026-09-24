import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [links, qrCodes] = await Promise.all([
    db.trackingLink.findMany({ where: { campaignId: id }, orderBy: { createdAt: "desc" } }),
    db.qRCode.findMany({ where: { campaignId: id }, orderBy: { createdAt: "desc" }, include: { trackingLink: true } }),
  ]);
  return NextResponse.json({ links, qrCodes });
}
