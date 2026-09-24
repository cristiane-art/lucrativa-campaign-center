import type { TrackingLink, QRCode } from "@prisma/client";
import { db } from "@/lib/db";
import { logActivity } from "@/lib/activityLog";
import { buildUtmUrl, buildShortUrl, generateShortCode } from "@/lib/utm";
import { parseJsonArray } from "@/lib/types";

// Tracking Agent — seção 13/14 e 42/43 do spec.
// Cálculo puro (UTM + código curto), NUNCA passa por LLM (REGRA 38).
// PERMISSÕES: read_campaign, write_tracking — nível AUTOMATIC (seção 32).

const CHANNEL_MEDIUM: Record<string, string> = {
  instagram: "social",
  facebook: "social",
  whatsapp: "message",
  google: "cpc",
  youtube: "social",
  linkedin: "social",
  email: "email",
  radio: "audio",
  parceiros: "referral",
  influenciadores: "referral",
  flyers: "print",
  cartazes: "print",
  eventos_presenciais: "print",
  outros: "referral",
};

const PHYSICAL_CHANNELS = new Set(["flyers", "cartazes", "eventos_presenciais", "radio", "parceiros"]);

function defaultDestination(campaignId: string): string {
  const base = (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
  return `${base}/inscricao/${campaignId}`;
}

export async function runTrackingAgent(campaignId: string) {
  const campaign = await db.campaign.findUniqueOrThrow({ where: { id: campaignId } });
  const channels = parseJsonArray<string>(campaign.channels);
  const destinationUrl = campaign.ctaLink?.trim() || defaultDestination(campaignId);

  await logActivity(campaignId, "tracking_agent", "Gerou links rastreáveis e QR Codes", {});

  const createdLinks: TrackingLink[] = [];
  const createdQr: QRCode[] = [];

  for (const channel of channels) {
    const existing = await db.trackingLink.findFirst({ where: { campaignId, source: channel } });
    if (existing) continue;

    const shortCode = generateShortCode();
    const utmUrl = buildUtmUrl({
      destinationUrl,
      source: channel,
      medium: CHANNEL_MEDIUM[channel] ?? "referral",
      campaignTag: campaign.name,
      content: channel,
    });

    const link = await db.trackingLink.create({
      data: {
        campaignId,
        source: channel,
        medium: CHANNEL_MEDIUM[channel] ?? "referral",
        campaignTag: campaign.name,
        content: channel,
        destinationUrl: utmUrl,
        shortCode,
      },
    });
    createdLinks.push(link);

    if (PHYSICAL_CHANNELS.has(channel)) {
      const label = `QR${String(createdQr.length + 1).padStart(2, "0")}`;
      const qr = await db.qRCode.create({
        data: {
          campaignId,
          trackingLinkId: link.id,
          label,
          physicalAsset: channel,
        },
      });
      createdQr.push(qr);
    }
  }

  await logActivity(
    campaignId,
    "tracking_agent",
    `Criou ${createdLinks.length} links UTM e ${createdQr.length} QR Codes`,
    { links: createdLinks.length, qrCodes: createdQr.length }
  );

  return { links: createdLinks, qrCodes: createdQr };
}

export { buildShortUrl };
