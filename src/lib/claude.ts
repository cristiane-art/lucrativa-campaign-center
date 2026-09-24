import Anthropic from "@anthropic-ai/sdk";
import { db } from "./db";

// REGRA 37/38: custo é medido, nunca inventado; regra em código, modelo
// barato para tarefas simples, modelo avançado só quando necessário.
// Tabela de preço oficial (US$ por milhão de tokens) — atualizar aqui se a
// Anthropic mudar preços; nunca espalhar valores mágicos pelo código.
const PRICING_USD_PER_MTOK: Record<string, { input: number; output: number }> = {
  "claude-opus-5": { input: 5.0, output: 25.0 },
  "claude-sonnet-5": { input: 2.0, output: 10.0 },
  "claude-haiku-4-5": { input: 1.0, output: 5.0 },
};

export function isClaudeConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!_client) _client = new Anthropic();
  return _client;
}

export function estimateCostUsd(model: string, inputTokens: number, outputTokens: number): number {
  const rate = PRICING_USD_PER_MTOK[model];
  if (!rate) return 0;
  return (inputTokens / 1_000_000) * rate.input + (outputTokens / 1_000_000) * rate.output;
}

export interface AgentCallResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

// Chamada de agente, com log automático de custo em AIUsage quando
// campaignId é informado. Lança se a chave não estiver configurada — o
// chamador decide o que fazer (nunca simula resposta).
export async function callAgent(opts: {
  agent: string;
  model: string;
  system: string;
  prompt: string;
  campaignId?: string;
  maxTokens?: number;
  webSearch?: { maxUses?: number };
}): Promise<AgentCallResult> {
  if (!isClaudeConfigured()) {
    throw new Error(
      "ANTHROPIC_API_KEY não configurada — o agente não pode ser executado. Configure a chave em .env."
    );
  }

  const client = getClient();
  const tools: Anthropic.ToolUnion[] | undefined = opts.webSearch
    ? [
        {
          type: "web_search_20260209",
          name: "web_search",
          max_uses: opts.webSearch.maxUses ?? 5,
        } satisfies Anthropic.WebSearchTool20260209,
      ]
    : undefined;

  const response = await client.messages.create({
    model: opts.model,
    max_tokens: opts.maxTokens ?? 4096,
    system: opts.system,
    messages: [{ role: "user", content: opts.prompt }],
    ...(tools ? { tools } : {}),
  });

  // Com web search, a resposta pode intercalar blocos de busca e texto — o
  // bloco de texto final (a síntese) é o que importa.
  const textBlocks = response.content.filter((b) => b.type === "text");
  const lastText = textBlocks[textBlocks.length - 1];
  const text = lastText && lastText.type === "text" ? lastText.text : "";
  const inputTokens = response.usage.input_tokens;
  const outputTokens = response.usage.output_tokens;
  const costUsd = estimateCostUsd(opts.model, inputTokens, outputTokens);

  if (opts.campaignId) {
    await db.aIUsage.create({
      data: {
        campaignId: opts.campaignId,
        agent: opts.agent,
        model: opts.model,
        inputTokens,
        outputTokens,
        estimatedCostUsd: costUsd,
      },
    });
  }

  return { text, inputTokens, outputTokens, costUsd };
}

// Extrai um JSON estruturado da resposta do modelo (o prompt deve instruir o
// modelo a responder só com JSON). Lança erro claro em vez de mascarar saída
// inválida como se fosse dado real (REGRA 10 — não inventar dados).
export function parseJsonResponse<T>(text: string): T {
  const trimmed = text.trim();
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const jsonText = fencedMatch ? fencedMatch[1] : trimmed;
  try {
    return JSON.parse(jsonText) as T;
  } catch (err) {
    throw new Error(`Resposta do agente não é JSON válido: ${(err as Error).message}`);
  }
}
