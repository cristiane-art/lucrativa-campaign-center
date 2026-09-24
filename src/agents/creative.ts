import { db } from "@/lib/db";
import { logActivity } from "@/lib/activityLog";
import { requestApproval } from "@/lib/approvals";
import { generateImage, type VisualBrief } from "@/lib/imageProvider";

// Creative Agent — seção 10 e 42/43 do spec.
// INPUT: ContentItem (texto já aprovado ou em revisão)
// OUTPUT: CreativeAsset com briefing visual estruturado + imagem (real ou mock)
// PERMISSÕES: read_content, write_assets.
//
// O briefing visual é derivado diretamente dos campos do ContentItem (regra >
// modelo — REGRA 38): não gasta uma chamada de IA só para reformular um
// texto que a campanha já tem.

const VISUAL_TYPES = new Set(["feed", "carrossel", "reel", "story", "anuncio", "flyer", "banner"]);

function briefFromContentItem(contentType: string, title: string, hook?: string | null, cta?: string | null): VisualBrief {
  return {
    headline: hook || title,
    subheadline: cta || undefined,
    format: contentType,
    notes: `Formato: ${contentType}.`,
  };
}

export async function runCreativeAgentForContentItem(contentItemId: string) {
  const item = await db.contentItem.findUniqueOrThrow({ where: { id: contentItemId } });

  if (!VISUAL_TYPES.has(item.contentType)) {
    return null; // conteúdo sem componente visual (ex: mensagem de WhatsApp)
  }

  const brief = briefFromContentItem(item.contentType, item.title, item.hook, item.cta);

  const asset = await db.creativeAsset.create({
    data: {
      campaignId: item.campaignId,
      contentItemId: item.id,
      assetType: item.contentType,
      channel: item.channel,
      briefJson: JSON.stringify(brief),
      status: "PENDING_GENERATION",
    },
  });

  await logActivity(item.campaignId, "creative_agent", `Criou briefing visual para "${item.title}"`, {
    creativeAssetId: asset.id,
  });

  try {
    const image = await generateImage(brief);
    const updated = await db.creativeAsset.update({
      where: { id: asset.id },
      data: { imageUrl: image.url, provider: image.provider, status: "GENERATED" },
    });
    await logActivity(
      item.campaignId,
      "creative_agent",
      `Gerou imagem (${image.provider}) para "${item.title}"`,
      { creativeAssetId: asset.id, provider: image.provider }
    );
    await requestApproval({
      campaignId: item.campaignId,
      entityType: "creative_asset",
      entityId: updated.id,
      level: "ASSISTED",
      summary: `Imagem "${item.title}" (${image.provider === "mock" ? "MOCK — revisar antes de usar" : image.provider}) pronta para revisão`,
      requestedBy: "creative_agent",
    });
    return updated;
  } catch (err) {
    const failed = await db.creativeAsset.update({
      where: { id: asset.id },
      data: { status: "FAILED" },
    });
    await logActivity(item.campaignId, "creative_agent", `Falha ao gerar imagem para "${item.title}": ${(err as Error).message}`, {
      creativeAssetId: asset.id,
    });
    return failed;
  }
}

export async function runCreativeAgent(campaignId: string) {
  const items = await db.contentItem.findMany({
    where: { campaignId, contentType: { in: Array.from(VISUAL_TYPES) } },
  });
  const results = [];
  for (const item of items) {
    const existing = await db.creativeAsset.findFirst({ where: { contentItemId: item.id } });
    if (existing) continue;
    const asset = await runCreativeAgentForContentItem(item.id);
    if (asset) results.push(asset);
  }
  return results;
}
