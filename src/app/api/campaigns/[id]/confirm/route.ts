import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { confirmAndRunCampaign } from "@/agents/orchestrator";

// O pipeline roda Pesquisa (com busca na web) → Estratégia → Conteúdo →
// Criativo em sequência — passa fácil do limite padrão de função serverless
// da Vercel (10s no plano Hobby). 60s é o máximo permitido nesse plano.
export const maxDuration = 60;

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const result = await confirmAndRunCampaign(id);
    return NextResponse.json({ result });
  } catch (err) {
    return jsonError((err as Error).message, 400);
  }
}
