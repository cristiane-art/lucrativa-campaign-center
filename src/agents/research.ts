import type { Campaign } from "@prisma/client";
import { db } from "@/lib/db";
import { callAgent, parseJsonResponse, isClaudeConfigured } from "@/lib/claude";
import { logActivity } from "@/lib/activityLog";
import { parseBriefingExtra, parseJsonArray, RESEARCH_CATEGORIES } from "@/lib/types";

// Research Agent — seção 7 e 42/43 do spec.
// INPUT: CampaignContext (campanha + briefing)
// OUTPUT: ResearchResult[] gravados no banco
// PERMISSÕES: read_campaign, web_research, write_research — nunca publica
// conteúdo nem decide estratégia.

const SYSTEM_PROMPT = `Você é o Research Agent da Lucrattiva, especialista em pesquisa de mercado para campanhas de marketing de contabilidade/agronegócio.

Sua tarefa: pesquisar na web informações realmente úteis para a campanha descrita, e responder SOMENTE com um JSON no formato:

{
  "results": [
    {
      "source": "nome do site/domínio ou 'web'",
      "title": "título curto do achado",
      "url": "URL da fonte, se houver",
      "summary": "resumo objetivo do achado, 1-3 frases",
      "category": "FACTUAL" | "INFERRED" | "RECOMMENDATION",
      "relevance": "ALTA" | "MEDIA" | "BAIXA"
    }
  ]
}

Regras obrigatórias:
- FACTUAL: só o que você encontrou e confirmou em uma fonte real (cite a URL).
- INFERRED: sua interpretação/dedução a partir dos achados — nunca apresente como fato.
- RECOMMENDATION: sugestão de ação baseada na pesquisa.
- Nunca invente URL, dado ou fonte. Se não encontrar nada relevante sobre um tópico, não crie um resultado falso para ele.
- Responda apenas com o JSON, sem texto antes ou depois.`;

interface ResearchResultItem {
  source: string;
  title: string;
  url?: string;
  summary: string;
  category: (typeof RESEARCH_CATEGORIES)[number];
  relevance?: "ALTA" | "MEDIA" | "BAIXA";
}

function buildPrompt(campaign: Campaign): string {
  const extra = parseBriefingExtra(campaign.briefingExtra);
  const channels = parseJsonArray<string>(campaign.channels);
  const lines = [
    `Campanha: ${campaign.name}`,
    campaign.description ? `Descrição: ${campaign.description}` : null,
    `Tipo: ${campaign.campaignType}`,
    campaign.primaryObjective ? `Objetivo principal: ${campaign.primaryObjective}` : null,
    campaign.audience ? `Público-alvo: ${campaign.audience}` : null,
    campaign.region ? `Região prioritária: ${campaign.region}` : null,
    campaign.eventDate ? `Data do evento: ${campaign.eventDate.toISOString().slice(0, 10)}` : null,
    extra.topics.length ? `Assuntos do evento: ${extra.topics.join(", ")}` : null,
    extra.motivationProblem ? `Por que o público deveria participar: ${extra.motivationProblem}` : null,
    channels.length ? `Canais disponíveis: ${channels.join(", ")}` : null,
    "",
    "Pesquise: público-alvo, tendências do setor, concorrentes/eventos semelhantes, assuntos relevantes de interesse desse público, empresas locais e parceiros potenciais na região informada, canais locais de divulgação, notícias recentes relevantes ao tema, e referências de formato de conteúdo que funcionam para esse nicho.",
  ].filter(Boolean);
  return lines.join("\n");
}

export async function runResearchAgent(campaignId: string) {
  const campaign = await db.campaign.findUniqueOrThrow({ where: { id: campaignId } });

  if (!isClaudeConfigured()) {
    await logActivity(campaignId, "research_agent", "Pesquisa não executada: ANTHROPIC_API_KEY não configurada", {});
    throw new Error("ANTHROPIC_API_KEY não configurada");
  }

  await logActivity(campaignId, "research_agent", "Iniciou pesquisa de mercado", {});

  const model = process.env.CLAUDE_MODEL_RESEARCH || "claude-sonnet-5";
  const { text } = await callAgent({
    agent: "research_agent",
    model,
    system: SYSTEM_PROMPT,
    prompt: buildPrompt(campaign),
    campaignId,
    webSearch: { maxUses: 6 },
    maxTokens: 8000,
  });

  const parsed = parseJsonResponse<{ results: ResearchResultItem[] }>(text);

  const created = await db.$transaction(
    parsed.results.map((r) =>
      db.researchResult.create({
        data: {
          campaignId,
          source: r.source,
          title: r.title,
          url: r.url ?? null,
          summary: r.summary,
          category: r.category,
          relevance: r.relevance ?? "MEDIA",
        },
      })
    )
  );

  await logActivity(campaignId, "research_agent", `Pesquisa concluída: ${created.length} achados registrados`, {
    count: created.length,
  });

  return created;
}
