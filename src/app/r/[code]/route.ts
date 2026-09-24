import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Redirecionador de link curto — incrementa clique (e scan de QR Code, se
// houver) e encaminha para a URL com UTM já embutida. Cálculo puro, sem LLM.
export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const link = await db.trackingLink.findUnique({ where: { shortCode: code } });
  if (!link) {
    return NextResponse.json({ error: "Link não encontrado" }, { status: 404 });
  }

  await db.trackingLink.update({ where: { id: link.id }, data: { clicks: { increment: 1 } } });
  await db.qRCode.updateMany({ where: { trackingLinkId: link.id }, data: { scans: { increment: 1 } } });

  return NextResponse.redirect(link.destinationUrl, { status: 302 });
}
