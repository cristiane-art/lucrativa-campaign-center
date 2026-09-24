import { db } from "@/lib/db";
import { generateQrCodeBuffer } from "@/lib/qrcode";
import { buildShortUrl } from "@/agents/tracking";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const qr = await db.qRCode.findUnique({ where: { id }, include: { trackingLink: true } });
  if (!qr || !qr.trackingLink) {
    return new Response("QR Code não encontrado", { status: 404 });
  }

  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const shortUrl = buildShortUrl(base, qr.trackingLink.shortCode);
  const buffer = await generateQrCodeBuffer(shortUrl);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="${qr.label}.png"`,
    },
  });
}
