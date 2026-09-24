import { db } from "@/lib/db";
import { callAgent, parseJsonResponse, isClaudeConfigured } from "@/lib/claude";
import { logActivity } from "@/lib/activityLog";
import { requestApproval } from "@/lib/approvals";
import { parseJsonArray } from "@/lib/types";
import { BRAND } from "@/lib/brand";

// Content Agent — seção 9 e 42/43 do spec.
// INPUT: StrategyPlan (calendário, mensagem, público)
// OUTPUT: ContentItem[] em DRAFT -> PENDING_APPROVAL (nível ASSISTED — nunca
//   publica sozinho, seção 32)
// PERMISSÕES: read_strategy, write_content.

const MAX_ITEMS_PER_RUN = 8; // controla custo — REGRA 38

const SYSTEM_PROMPT = `Você é o Content Agent da Lucrattiva Contabilidade (agribusiness), redator de redes sociais.

Identidade de marca:
- Nome: "Lucrattiva Contabilidade" (grafia com dois T).
- Tom de voz: ${BRAND.tone}
- Cores: verde institucional ${BRAND.colors.accent}, dourado ${BRAND.colors.amber} (para orientar os briefings visuais que outro agente vai usar).

Com base na mensagem central, público e calendário da campanha, produza os textos de conteúdo. Responda SOMENTE com um JSON:

{
  "items": [
    {
      "contentType": "feed" | "carrossel" | "reel" | "story" | "post" | "anuncio" | "convite_whatsapp" | "lembrete_whatsapp",
      "channel": "instagram" | "facebook" | "whatsapp" | "radio" | "outro",
      "title": "título interno curto (para identificar no painel)",
      "hook": "gancho/abertura chamativa",
      "body": "texto completo pronto para publicar",
      "cta": "chamada para ação",
      "targetAudience": "para quem é esse conteúdo",
      "scheduledDate": "AAAA-MM-DD, baseado no calendário fornecido"
    }
  ]
}

Regras obrigatórias:
- Use SEMPRE "Lucrattiva" (dois T), nunca "Lucrativa".
- Tom caloroso e próximo, nunca genérico ou corporativo demais.
- Nunca invente dado, estatística ou depoimento — se precisar de um número, deixe um placeholder claro como "[confirmar número]".
- Gere no máximo ${MAX_ITEMS_PER_RUN} itens nesta rodada, priorizando os primeiros dias do calendário.
- Responda apenas com o JSON, sem texto antes ou depois.`;

export async function runContentAgent(campaignId: string) {
  const campaign = await db.campaign.findUniqueOrThrow({ where: { id: campaignId } });
  const plan = await db.strategyPlan.findFirst({
    where: { campaignId },
    orderBy: { createdAt: "desc" },
  });

  if (!plan) {
    throw new Error("Content Agent precisa de um StrategyPlan existente para gerar conteúdo.");
  }
  if (!isClaudeConfigured()) {
    await logActivity(campaignId, "content_agent", "Conteúdo não gerado: ANTHROPIC_API_KEY não configurada", {});
    throw new Error("ANTHROPIC_API_KEY não configurada");
  }

  await logActivity(campaignId, "content_agent", "Iniciou geração de conteúdo", {});

  const calendar = parseJsonArray<Record<string, unknown>>(plan.calendar);
  const prompt = [
    `Campanha: ${campaign.name}`,
    `Mensagem principal: ${plan.keyMessage}`,
    `Proposta de valor: ${plan.valueProposition}`,
    `Público principal: ${plan.primaryAudience}`,
    campaign.cta ? `CTA da campanha: ${campaign.cta}` : null,
    "",
    "Calendário estratégico (gere conteúdo para os primeiros itens):",
    JSON.stringify(calendar.slice(0, MAX_ITEMS_PER_RUN), null, 2),
  ]
    .filter(Boolean)
    .join("\n");

  const model = process.env.CLAUDE_MODEL_CONTENT || "claude-sonnet-5";
  const { text } = await callAgent({
    agent: "content_agent",
    model,
    system: SYSTEM_PROMPT,
    prompt,
    campaignId,
    maxTokens: 8000,
  });

  const parsed = parseJsonResponse<{
    items: Array<{
      contentType: string;
      channel: string;
      title: string;
      hook?: string;
      body: string;
      cta?: string;
      targetAudience?: string;
      scheduledDate?: string;
    }>;
  }>(text);

  const created = [];
  for (const item of parsed.items.slice(0, MAX_ITEMS_PER_RUN)) {
    const contentItem = await db.contentItem.create({
      data: {
        campaignId,
        contentType: item.contentType,
        channel: item.channel,
        title: item.title,
        hook: item.hook,
        body: item.body,
        cta: item.cta,
        targetAudience: item.targetAudience,
        status: "PENDING_APPROVAL",
        scheduledAt: item.scheduledDate ? new Date(item.scheduledDate) : null,
        generatedBy: "content_agent",
      },
    });
    await requestApproval({
      campaignId,
      entityType: "content_item",
      entityId: contentItem.id,
      level: "ASSISTED",
      summary: `Conteúdo "${contentItem.title}" (${contentItem.channel}) pronto para revisão`,
      requestedBy: "content_agent",
    });
    created.push(contentItem);
  }

  await logActivity(campaignId, "content_agent", `Gerou ${created.length} conteúdos para aprovação`, {
    count: created.length,
  });

  return created;
}
