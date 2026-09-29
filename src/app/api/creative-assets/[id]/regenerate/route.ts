import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jsonError } from "@/lib/api";
import { logActivity } from "@/lib/activityLog";
import { generateImage, type VisualBrief } from "@/lib/imageProvider";

// Regenera a imagem de um CreativeAsset já existente com o provedor
// configurado agora (ex: alguém acabou de ligar IMAGE_PROVIDER=stock depois
// que a peça já tinha sido gerada em modo mock). Usa o mesmo briefJson salvo
// na criação — nunca inventa um brief novo.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const asset = await db.creativeAsset.findUnique({ where: { id } });
  if (!asset) return jsonError("Peça criativa não encontrada", 404);

  const brief = JSON.parse(asset.briefJson) as VisualBrief;

  try {
    const image = await generateImage(brief);
    const updated = await db.creativeAsset.update({
      where: { id },
      data: { imageUrl: image.url, provider: image.provider, status: "GENERATED" },
    });
    await logActivity(asset.campaignId, "creative_agent", `Regenerou imagem (${image.provider}) para peça "${asset.assetType}"`, {
      creativeAssetId: asset.id,
      provider: image.provider,
    });
    return NextResponse.json({ asset: updated });
  } catch (err) {
    return jsonError(`Falha ao regenerar imagem: ${(err as Error).message}`, 502);
  }
}
