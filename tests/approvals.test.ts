import { describe, it, expect, beforeAll } from "vitest";
import { db } from "@/lib/db";
import { requestApproval, decideApproval } from "@/lib/approvals";

describe("Approval System", () => {
  let campaignId: string;

  beforeAll(async () => {
    const client = await db.client.create({ data: { slug: `t-approvals-${Date.now()}`, name: "Cliente Approvals" } });
    const campaign = await db.campaign.create({
      data: { clientId: client.id, name: "Campanha Approvals", campaignType: "evento" },
    });
    campaignId = campaign.id;
  });

  it("nível AUTOMATIC já nasce aprovado, sem esperar humano", async () => {
    const approval = await requestApproval({
      campaignId,
      entityType: "research_result",
      entityId: "r1",
      level: "AUTOMATIC",
      summary: "Pesquisa concluída",
      requestedBy: "research_agent",
    });
    expect(approval.status).toBe("APPROVED");
    expect(approval.decidedBy).toBe("sistema");
  });

  it("nível HUMAN_APPROVAL fica PENDING até decisão humana", async () => {
    const approval = await requestApproval({
      campaignId,
      entityType: "budget_change",
      entityId: "b1",
      level: "HUMAN_APPROVAL",
      summary: "Aumentar orçamento de anúncios",
      requestedBy: "ads_agent",
    });
    expect(approval.status).toBe("PENDING");

    const decided = await decideApproval(approval.id, "APPROVED", "usuario");
    expect(decided.status).toBe("APPROVED");
    expect(decided.decidedBy).toBe("usuario");
    expect(decided.decidedAt).not.toBeNull();
  });

  it("rejeitar registra o motivo do requerente e não aprova por engano", async () => {
    const approval = await requestApproval({
      campaignId,
      entityType: "content_item",
      entityId: "c1",
      level: "ASSISTED",
      summary: "Conteúdo pronto para revisão",
      requestedBy: "content_agent",
    });
    const decided = await decideApproval(approval.id, "REJECTED", "usuario");
    expect(decided.status).toBe("REJECTED");
  });
});
