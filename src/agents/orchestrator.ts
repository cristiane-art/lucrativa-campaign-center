import { db } from "@/lib/db";
import { logActivity } from "@/lib/activityLog";
import { checkCampaignCompleteness } from "@/lib/completeness";
import { createTask } from "@/lib/taskEngine";
import { isClaudeConfigured } from "@/lib/claude";
import { runResearchAgent } from "./research";
import { runStrategyAgent } from "./strategy";
import { runContentAgent } from "./content";
import { runCreativeAgent } from "./creative";
import { runTrackingAgent } from "./tracking";

// Campaign Orchestrator — seção 24 do spec.
// Fluxo: BRIEFING (confirmado) -> RESEARCH -> STRATEGY -> CONTENT -> CREATIVE
// -> TRACKING -> TASKS. Cada estágio é resiliente: se um agente de IA falhar
// (ex.: sem ANTHROPIC_API_KEY), registra o erro, cria uma tarefa humana
// explicando o bloqueio, e segue para o próximo estágio que não depende dele.
// Nunca deixa a campanha "travada" silenciosamente (REGRA 8/9).

export interface OrchestratorResult {
  ok: boolean;
  stages: Record<string, "ok" | "skipped" | "failed">;
  errors: Record<string, string>;
}

export async function confirmAndRunCampaign(campaignId: string): Promise<OrchestratorResult> {
  const campaign = await db.campaign.findUniqueOrThrow({ where: { id: campaignId } });
  const completeness = checkCampaignCompleteness(campaign);

  if (!completeness.complete) {
    throw new Error(
      `Campanha incompleta — pendências obrigatórias: ${completeness.missing.join(", ")}`
    );
  }

  await db.campaign.update({
    where: { id: campaignId },
    data: {
      status: "PLANNING",
      briefingComplete: true,
      briefingMissing: JSON.stringify(completeness.recommended),
    },
  });
  await logActivity(campaignId, "orchestrator", "Briefing confirmado — iniciando pipeline de agentes", {});

  const stages: OrchestratorResult["stages"] = {};
  const errors: OrchestratorResult["errors"] = {};

  if (!isClaudeConfigured()) {
    await createTask({
      campaignId,
      title: "Configurar ANTHROPIC_API_KEY para ativar os agentes de IA",
      description:
        "Sem a chave, pesquisa, estratégia, conteúdo e briefings visuais não são gerados automaticamente. Links, QR Codes e tarefas continuam funcionando normalmente.",
      type: "other",
      assignedTo: "equipe",
      priority: "ALTA",
      automationLevel: "HUMAN",
    });
  }

  // 1. Research
  try {
    await runResearchAgent(campaignId);
    stages.research = "ok";
  } catch (err) {
    stages.research = isClaudeConfigured() ? "failed" : "skipped";
    errors.research = (err as Error).message;
  }

  // 2. Strategy (roda mesmo sem pesquisa — só não terá achados para basear)
  try {
    await runStrategyAgent(campaignId);
    stages.strategy = "ok";
  } catch (err) {
    stages.strategy = isClaudeConfigured() ? "failed" : "skipped";
    errors.strategy = (err as Error).message;
  }

  // 3. Content (depende de estratégia)
  if (stages.strategy === "ok") {
    try {
      await runContentAgent(campaignId);
      stages.content = "ok";
    } catch (err) {
      stages.content = "failed";
      errors.content = (err as Error).message;
    }
  } else {
    stages.content = "skipped";
  }

  // 4. Creative (depende de conteúdo)
  if (stages.content === "ok") {
    try {
      await runCreativeAgent(campaignId);
      stages.creative = "ok";
    } catch (err) {
      stages.creative = "failed";
      errors.creative = (err as Error).message;
    }
  } else {
    stages.creative = "skipped";
  }

  // 5. Tracking — sempre roda, é cálculo puro (REGRA 38)
  try {
    await runTrackingAgent(campaignId);
    stages.tracking = "ok";
  } catch (err) {
    stages.tracking = "failed";
    errors.tracking = (err as Error).message;
  }

  // 6. Tarefas humanas iniciais (seção 25/26)
  await seedInitialTasks(campaignId, stages);

  await db.campaign.update({
    where: { id: campaignId },
    data: { status: "ACTIVE" },
  });

  await logActivity(campaignId, "orchestrator", "Pipeline inicial concluído", { stages });

  return { ok: Object.values(stages).every((s) => s !== "failed"), stages, errors };
}

async function seedInitialTasks(campaignId: string, stages: OrchestratorResult["stages"]) {
  if (stages.content === "ok") {
    await createTask({
      campaignId,
      title: "Revisar e aprovar os conteúdos gerados",
      description: "O Content Agent preparou rascunhos — revise, edite se necessário e aprove antes de agendar.",
      type: "content",
      assignedTo: "equipe",
      priority: "ALTA",
      automationLevel: "ASSISTED",
    });
  }
  if (stages.creative === "ok") {
    await createTask({
      campaignId,
      title: "Revisar imagens geradas (verificar se algum item ficou em modo MOCK)",
      description: "Itens com provider=mock precisam de uma imagem real antes de publicar.",
      type: "creative",
      assignedTo: "equipe",
      priority: "MEDIA",
      automationLevel: "ASSISTED",
    });
  }
  if (stages.tracking === "ok") {
    await createTask({
      campaignId,
      title: "Baixar e distribuir os QR Codes gerados",
      description: "QR Codes já foram criados para os canais físicos informados no briefing.",
      type: "physical",
      assignedTo: "equipe",
      priority: "MEDIA",
      automationLevel: "HUMAN",
    });
  }
  await createTask({
    campaignId,
    title: "Definir orçamento de mídia paga, se ainda não definido",
    description: "Nenhum valor é assumido automaticamente — confirme o orçamento real antes de criar anúncios.",
    type: "ads",
    assignedTo: "equipe",
    priority: "MEDIA",
    automationLevel: "HUMAN",
  });
}
