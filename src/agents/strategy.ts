import { db } from "@/lib/db";
import { callAgent, parseJsonResponse, isClaudeConfigured } from "@/lib/claude";
import { logActivity } from "@/lib/activityLog";
import { parseBriefingExtra, parseJsonArray } from "@/lib/types";

// Strategy Agent — seção 8 e 42/43 do spec.
// INPUT: campanha + pesquisas (ResearchResult[])
// OUTPUT: StrategyPlan (objetivo, público, mensagem, canais, funil, calendário,
//   KPIs, orçamento sugerido, plano de contingência)
// PERMISSÕES: read_campaign, read_research, write_strategy — nunca cria
// conteúdo nem publica nada.

const SYSTEM_PROMPT = `Você é o Strategy Agent da Lucrattiva, estrategista de marketing sênior.

Com base no briefing da campanha e nas pesquisas fornecidas, produza um plano estratégico. Responda SOMENTE com um JSON no formato:

{
  "primaryAudience": "descrição do público principal",
  "secondaryAudiences": ["..."],
  "valueProposition": "proposta de valor central",
  "keyMessage": "mensagem principal da campanha",
  "secondaryMessages": ["..."],
  "channelStrategy": [{"channel": "instagram", "role": "por que usar esse canal", "cadence": "ex: 3x por semana"}],
  "funnel": [{"stage": "Alcance", "targetLabel": "descrição da meta nesse estágio", "estimate": "número ou faixa, se calculável", "isEstimate": true}],
  "calendar": [{"date": "AAAA-MM-DD", "theme": "tema do dia", "channel": "canal", "format": "reel/story/post/etc"}],
  "kpis": [{"label": "nome do KPI", "target": "valor alvo", "isEstimate": true}],
  "budgetSuggestion": {"ads": "sugestão", "criativo": "sugestão", "observacao": "texto livre"},
  "contingencyPlan": "o que fazer se o ritmo estiver abaixo do esperado"
}

Regras obrigatórias:
- NUNCA invente benchmarks como se fossem fatos. Todo número que for estimativa deve ter "isEstimate": true e, quando possível, uma explicação da base de cálculo.
- Se a meta ou orçamento da campanha não foram informados, não invente valores — diga isso em "contingencyPlan" e deixe os campos dependentes como estimativas claramente marcadas.
- O calendário deve ser realista para o prazo restante até a data do evento (se houver) — nunca proponha mais conteúdo do que cabe no tempo disponível.
- Responda apenas com o JSON, sem texto antes ou depois.`;

function buildPrompt(campaignId: string, briefing: string, researchSummary: string): string {
  return [briefing, "", "Pesquisas disponíveis:", researchSummary || "(nenhuma pesquisa registrada)"].join("\n");
}

export async function runStrategyAgent(campaignId: string) {
  const campaign = await db.campaign.findUniqueOrThrow({ where: { id: campaignId } });
  const research = await db.researchResult.findMany({ where: { campaignId } });

  if (!isClaudeConfigured()) {
    await logActivity(campaignId, "strategy_agent", "Estratégia não executada: ANTHROPIC_API_KEY não configurada", {});
    throw new Error("ANTHROPIC_API_KEY não configurada");
  }

  await logActivity(campaignId, "strategy_agent", "Iniciou elaboração da estratégia", {});

  const extra = parseBriefingExtra(campaign.briefingExtra);
  const channels = parseJsonArray<string>(campaign.channels);
  const daysUntilEvent = campaign.eventDate
    ? Math.max(0, Math.ceil((campaign.eventDate.getTime() - Date.now()) / 86_400_000))
    : null;

  const briefing = [
    `Campanha: ${campaign.name} (${campaign.campaignType})`,
    campaign.primaryObjective ? `Objetivo principal: ${campaign.primaryObjective}` : "Objetivo principal: não informado",
    campaign.audience ? `Público: ${campaign.audience}` : "Público: não informado",
    campaign.region ? `Região: ${campaign.region}` : null,
    campaign.targetResult
      ? `Meta: ${campaign.targetResult} ${campaign.targetMetricLabel ?? ""}`
      : "Meta: não definida pelo usuário — não invente uma",
    campaign.eventDate
      ? `Data do evento: ${campaign.eventDate.toISOString().slice(0, 10)} (${daysUntilEvent} dias restantes)`
      : null,
    campaign.eventCapacity ? `Capacidade do evento: ${campaign.eventCapacity}` : null,
    campaign.budgetRangeLabel || campaign.adBudget
      ? `Orçamento: ${campaign.budgetRangeLabel ?? ""} ${campaign.adBudget ? `R$${campaign.adBudget}` : ""}`.trim()
      : "Orçamento: não informado — não invente valores",
    channels.length ? `Canais disponíveis: ${channels.join(", ")}` : null,
    campaign.valueProposition ? `Proposta de valor já definida: ${campaign.valueProposition}` : null,
    extra.motivationProblem ? `Motivação do público: ${extra.motivationProblem}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const researchSummary = research
    .map((r) => `[${r.category}] ${r.title}: ${r.summary}${r.url ? ` (${r.url})` : ""}`)
    .join("\n");

  const model = process.env.CLAUDE_MODEL_STRATEGY || "claude-sonnet-5";
  const { text } = await callAgent({
    agent: "strategy_agent",
    model,
    system: SYSTEM_PROMPT,
    prompt: buildPrompt(campaignId, briefing, researchSummary),
    campaignId,
    maxTokens: 6000,
  });

  const parsed = parseJsonResponse<{
    primaryAudience: string;
    secondaryAudiences: string[];
    valueProposition: string;
    keyMessage: string;
    secondaryMessages: string[];
    channelStrategy: unknown[];
    funnel: unknown[];
    calendar: unknown[];
    kpis: unknown[];
    budgetSuggestion: Record<string, unknown>;
    contingencyPlan: string;
  }>(text);

  const plan = await db.strategyPlan.create({
    data: {
      campaignId,
      primaryAudience: parsed.primaryAudience,
      secondaryAudiences: JSON.stringify(parsed.secondaryAudiences ?? []),
      valueProposition: parsed.valueProposition,
      keyMessage: parsed.keyMessage,
      secondaryMessages: JSON.stringify(parsed.secondaryMessages ?? []),
      channelStrategy: JSON.stringify(parsed.channelStrategy ?? []),
      funnel: JSON.stringify(parsed.funnel ?? []),
      calendar: JSON.stringify(parsed.calendar ?? []),
      kpis: JSON.stringify(parsed.kpis ?? []),
      budgetSuggestion: JSON.stringify(parsed.budgetSuggestion ?? {}),
      contingencyPlan: parsed.contingencyPlan,
    },
  });

  await logActivity(campaignId, "strategy_agent", "Estratégia concluída", { strategyPlanId: plan.id });

  return plan;
}
