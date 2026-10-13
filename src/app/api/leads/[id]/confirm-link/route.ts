import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jsonError } from "@/lib/api";
import { generateShortCode, buildShortUrl } from "@/lib/utm";

// Gera (ou reaproveita) um link curto /r/xxxxxxx pra página de confirmação
// de presença de um lead específico. Existe porque o link direto
// /confirmar/[leadId] é longo e, enviado por WhatsApp, o domínio
// .vercel.app às vezes dispara o aviso de "link pode não ser seguro" do
// WhatsApp — um link curto do próprio domínio reduz esse atrito.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: leadId } = await params;
  const lead = await db.lead.findUnique({ where: { id: leadId } });
  if (!lead) return jsonError("Lead não encontrado", 404);

  const base = (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
  const destinationUrl = `${base}/confirmar/${leadId}`;

  const existing = await db.trackingLink.findFirst({
    where: { campaignId: lead.campaignId, destinationUrl },
  });
  if (existing) {
    return NextResponse.json({ shortUrl: buildShortUrl(base, existing.shortCode) });
  }

  let shortCode = generateShortCode();
  // Colisão é praticamente impossível (7 chars, alfabeto sem ambíguos), mas
  // o índice é único no banco — tenta de novo em vez de deixar a request
  // quebrar numa coincidência de 1 em milhões.
  for (let attempt = 0; attempt < 5; attempt++) {
    const clash = await db.trackingLink.findUnique({ where: { shortCode } });
    if (!clash) break;
    shortCode = generateShortCode();
  }

  const link = await db.trackingLink.create({
    data: {
      campaignId: lead.campaignId,
      source: "whatsapp",
      medium: "message",
      campaignTag: "confirmacao_presenca",
      destinationUrl,
      shortCode,
    },
  });

  return NextResponse.json({ shortUrl: buildShortUrl(base, link.shortCode) });
}
