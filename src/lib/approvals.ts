import { db } from "./db";
import { logActivity } from "./activityLog";

// Sistema de aprovação — seção 32 do spec.
// AUTOMATIC: pesquisas, relatórios, QR/UTM, rascunhos -> nunca passam por aqui.
// ASSISTED: conteúdo gerado, campanhas de anúncio preparadas -> registrado, mas
//   liberado para revisão sem bloquear o restante do fluxo.
// HUMAN_APPROVAL: publicação, envio em massa, gasto, orçamento -> precisa do
//   clique explícito do usuário antes de qualquer ação subsequente.
export type ApprovalLevel = "AUTOMATIC" | "ASSISTED" | "HUMAN_APPROVAL";

export async function requestApproval(opts: {
  campaignId: string;
  entityType: string;
  entityId: string;
  level: ApprovalLevel;
  summary: string;
  requestedBy: string;
}) {
  const approval = await db.approval.create({
    data: {
      campaignId: opts.campaignId,
      entityType: opts.entityType,
      entityId: opts.entityId,
      level: opts.level,
      summary: opts.summary,
      requestedBy: opts.requestedBy,
      status: opts.level === "AUTOMATIC" ? "APPROVED" : "PENDING",
      decidedBy: opts.level === "AUTOMATIC" ? "sistema" : null,
      decidedAt: opts.level === "AUTOMATIC" ? new Date() : null,
    },
  });
  await logActivity(opts.campaignId, opts.requestedBy, `Solicitou aprovação (${opts.level}): ${opts.summary}`, {
    approvalId: approval.id,
    entityType: opts.entityType,
    entityId: opts.entityId,
  });
  return approval;
}

export async function decideApproval(approvalId: string, decision: "APPROVED" | "REJECTED", decidedBy: string) {
  const approval = await db.approval.update({
    where: { id: approvalId },
    data: { status: decision, decidedBy, decidedAt: new Date() },
  });
  await logActivity(
    approval.campaignId,
    decidedBy,
    `${decision === "APPROVED" ? "Aprovou" : "Rejeitou"}: ${approval.summary}`,
    { approvalId: approval.id }
  );
  return approval;
}
