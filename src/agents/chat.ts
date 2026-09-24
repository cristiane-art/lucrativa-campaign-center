import { db } from "@/lib/db";
import { callAgent, parseJsonResponse, isClaudeConfigured } from "@/lib/claude";
import { checkCampaignCompleteness, fieldLabel } from "@/lib/completeness";
import { parseBriefingExtra, parseJsonArray } from "@/lib/types";
import { CampaignUpdateSchema, updateCampaignFromWizard, type CampaignUpdateInput } from "@/lib/campaignUpdate";
import { BRAND } from "@/lib/brand";

// Campaign Chat / Copilot — seções 25/26 (extração de briefing) e 48
// (copiloto de campanha) do spec. Não é um chatbot genérico: conhece o
// estado atual da campanha e escreve direto no briefing quando identifica
// informação nova, sem nunca inventar valor que o usuário não deu.

const SYSTEM_PROMPT = `Você é o Copiloto de Campanhas da ${BRAND.fullName}, assistente que ajuda a equipe a configurar e acompanhar campanhas de marketing.

Você recebe o estado atual do briefing da campanha e a mensagem do usuário. Responda SOMENTE com um JSON:

{
  "reply": "sua resposta em português, curta e direta, como um profissional de marketing conversando",
  "extractedFields": { ...apenas os campos que você tem CERTEZA que o usuário informou nesta mensagem... }
}

Campos possíveis em extractedFields (todos opcionais, use só o que foi dito):
name, description, primaryObjective (um de: LOTAR_EVENTO, GERAR_LEADS, CONSEGUIR_CLIENTES, FORTALECER_MARCA, EDUCAR_PUBLICO, LANCAR_PRODUTO, RELACIONAMENTO_CLIENTES, OUTRO), audience, region, eventDate (ISO 8601), eventTime, eventLocation, eventFormat (presencial|online|hibrido), eventCapacity (número), eventIsPaid (booleano), eventPrice (número), targetResult (número), targetMetricLabel, valueProposition, cta, channels (array de strings), budgetRangeLabel.

Regras obrigatórias:
- NUNCA invente um valor para extractedFields que o usuário não disse explicitamente. Na dúvida, não extraia — apenas pergunte na "reply".
- Se o campo já estiver preenchido no briefing atual, não repita a pergunta sobre ele.
- Se faltar informação obrigatória para confirmar a campanha, pergunte sobre ela na "reply" (uma ou duas perguntas por vez, nunca uma lista enorme).
- Se o usuário perguntar sobre métricas/leads/tarefas, responda com os números fornecidos no contexto — nunca invente números.
- Se o usuário não souber responder algo (orçamento, meta), tranquilize e ofereça ajudar a definir depois — isso não é um erro.
- Responda apenas com o JSON, sem texto antes ou depois.`;

function buildContext(campaign: Awaited<ReturnType<typeof db.campaign.findUniqueOrThrow>>, counts: {
  leads: number;
  registered: number;
  confirmed: number;
  attended: number;
  pendingTasks: number;
  pendingApprovals: number;
}): string {
  const completeness = checkCampaignCompleteness(campaign);
  const extra = parseBriefingExtra(campaign.briefingExtra);
  const channels = parseJsonArray<string>(campaign.channels);

  return [
    `Estado atual do briefing:`,
    `- Nome: ${campaign.name}`,
    `- Tipo: ${campaign.campaignType}`,
    `- Status: ${campaign.status}`,
    `- Objetivo principal: ${campaign.primaryObjective ?? "não informado"}`,
    `- Público: ${campaign.audience ?? "não informado"}`,
    `- Região: ${campaign.region ?? "não informado"}`,
    campaign.campaignType === "evento"
      ? `- Evento: data=${campaign.eventDate?.toISOString().slice(0, 10) ?? "?"} local=${campaign.eventLocation ?? "?"} formato=${campaign.eventFormat ?? "?"} capacidade=${campaign.eventCapacity ?? "?"}`
      : null,
    `- Meta: ${campaign.targetResult ?? "não definida"} ${campaign.targetMetricLabel ?? ""}`,
    `- Orçamento: ${campaign.budgetRangeLabel ?? (campaign.adBudget ? `R$${campaign.adBudget}` : "não informado")}`,
    `- Canais: ${channels.length ? channels.join(", ") : "nenhum informado"}`,
    extra.motivationProblem ? `- Motivação do público: ${extra.motivationProblem}` : null,
    `- Pendências obrigatórias para confirmar: ${completeness.missing.length ? completeness.missing.map(fieldLabel).join(", ") : "nenhuma"}`,
    ``,
    `Métricas atuais (dados reais, nunca invente outros números):`,
    `- Leads totais: ${counts.leads}`,
    `- Inscritos: ${counts.registered}`,
    `- Confirmados: ${counts.confirmed}`,
    `- Presentes: ${counts.attended}`,
    `- Tarefas pendentes: ${counts.pendingTasks}`,
    `- Aprovações pendentes: ${counts.pendingApprovals}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export async function runCampaignChat(campaignId: string, userMessage: string) {
  const campaign = await db.campaign.findUniqueOrThrow({ where: { id: campaignId } });

  await db.chatMessage.create({ data: { campaignId, role: "user", content: userMessage } });

  const [leads, registered, confirmed, attended, pendingTasks, pendingApprovals] = await Promise.all([
    db.lead.count({ where: { campaignId } }),
    db.lead.count({ where: { campaignId, status: { in: ["REGISTERED", "CONFIRMED", "ATTENDED"] } } }),
    db.lead.count({ where: { campaignId, status: { in: ["CONFIRMED", "ATTENDED"] } } }),
    db.lead.count({ where: { campaignId, status: "ATTENDED" } }),
    db.task.count({ where: { campaignId, status: { notIn: ["COMPLETED", "CANCELLED"] } } }),
    db.approval.count({ where: { campaignId, status: "PENDING" } }),
  ]);

  if (!isClaudeConfigured()) {
    const reply =
      "O chat inteligente precisa da ANTHROPIC_API_KEY configurada para interpretar sua mensagem. " +
      "Por enquanto, use o formulário de configuração da campanha diretamente.";
    await db.chatMessage.create({ data: { campaignId, role: "assistant", content: reply } });
    return { reply, extractedFields: null, campaign };
  }

  const history = await db.chatMessage.findMany({
    where: { campaignId },
    orderBy: { createdAt: "asc" },
    take: 20,
  });

  const context = buildContext(campaign, { leads, registered, confirmed, attended, pendingTasks, pendingApprovals });
  const conversation = history.map((m) => `${m.role === "user" ? "Usuário" : "Copiloto"}: ${m.content}`).join("\n");

  const model = process.env.CLAUDE_MODEL_CHAT || "claude-sonnet-5";
  const { text } = await callAgent({
    agent: "chat_copilot",
    model,
    system: SYSTEM_PROMPT,
    prompt: `${context}\n\nConversa até agora:\n${conversation}\n\nResponda à última mensagem do usuário.`,
    campaignId,
    maxTokens: 2000,
  });

  let reply: string;
  let extractedFields: CampaignUpdateInput | null = null;
  try {
    const parsed = parseJsonResponse<{ reply: string; extractedFields?: Record<string, unknown> }>(text);
    reply = parsed.reply;
    if (parsed.extractedFields && Object.keys(parsed.extractedFields).length > 0) {
      const validated = CampaignUpdateSchema.partial().safeParse(parsed.extractedFields);
      if (validated.success) extractedFields = validated.data;
    }
  } catch {
    reply = text || "Não consegui processar isso — pode reformular?";
  }

  let updatedCampaign = campaign;
  if (extractedFields) {
    updatedCampaign = await updateCampaignFromWizard(campaignId, extractedFields);
  }

  await db.chatMessage.create({ data: { campaignId, role: "assistant", content: reply } });

  return { reply, extractedFields, campaign: updatedCampaign };
}
