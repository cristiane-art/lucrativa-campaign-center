import { describe, it, expect, beforeAll } from "vitest";
import { db } from "@/lib/db";
import { createTask, completeTask, updateTaskStatus } from "@/lib/taskEngine";

describe("Task Engine", () => {
  let campaignId: string;

  beforeAll(async () => {
    const client = await db.client.create({ data: { slug: `t-tasks-${Date.now()}`, name: "Cliente Tasks" } });
    const campaign = await db.campaign.create({
      data: { clientId: client.id, name: "Campanha Tasks", campaignType: "evento" },
    });
    campaignId = campaign.id;
  });

  it("cria tarefa com status TODO e registra no activity log", async () => {
    const task = await createTask({ campaignId, title: "Revisar conteúdo", type: "content" });
    expect(task.status).toBe("TODO");
    expect(task.campaignId).toBe(campaignId);

    const logs = await db.activityLog.findMany({ where: { campaignId, agent: "task_engine" } });
    expect(logs.some((l) => l.action.includes("Revisar conteúdo"))).toBe(true);
  });

  it("toda tarefa carrega campaign_id (REGRA 7)", async () => {
    const task = await createTask({ campaignId, title: "Tarefa qualquer", type: "other" });
    expect(task.campaignId).toBeTruthy();
  });

  it("completeTask marca COMPLETED e preenche completedAt", async () => {
    const task = await createTask({ campaignId, title: "Concluir isso", type: "other" });
    const completed = await completeTask(task.id);
    expect(completed.status).toBe("COMPLETED");
    expect(completed.completedAt).not.toBeNull();
  });

  it("updateTaskStatus transita entre estados válidos", async () => {
    const task = await createTask({ campaignId, title: "Em progresso", type: "other" });
    const inProgress = await updateTaskStatus(task.id, "IN_PROGRESS");
    expect(inProgress.status).toBe("IN_PROGRESS");
    expect(inProgress.completedAt).toBeNull();

    const blocked = await updateTaskStatus(task.id, "BLOCKED");
    expect(blocked.status).toBe("BLOCKED");
  });
});
