import { db } from "./db";
import { logActivity } from "./activityLog";

export interface CreateTaskInput {
  campaignId: string;
  title: string;
  description?: string;
  type: string;
  assignedTo?: "agente" | "equipe" | string;
  priority?: "ALTA" | "MEDIA" | "BAIXA";
  automationLevel?: "AUTOMATIC" | "ASSISTED" | "HUMAN";
  dueDate?: Date;
}

export async function createTask(input: CreateTaskInput) {
  const task = await db.task.create({
    data: {
      campaignId: input.campaignId,
      title: input.title,
      description: input.description,
      type: input.type,
      assignedTo: input.assignedTo ?? "agente",
      priority: input.priority ?? "MEDIA",
      automationLevel: input.automationLevel ?? "HUMAN",
      dueDate: input.dueDate,
    },
  });
  await logActivity(input.campaignId, "task_engine", `Criou tarefa: ${input.title}`, {
    taskId: task.id,
    type: input.type,
  });
  return task;
}

export async function completeTask(taskId: string) {
  const task = await db.task.update({
    where: { id: taskId },
    data: { status: "COMPLETED", completedAt: new Date() },
  });
  await logActivity(task.campaignId, "task_engine", `Concluiu tarefa: ${task.title}`, {
    taskId: task.id,
  });
  return task;
}

export async function updateTaskStatus(
  taskId: string,
  status: "TODO" | "IN_PROGRESS" | "WAITING_APPROVAL" | "BLOCKED" | "COMPLETED" | "CANCELLED"
) {
  const task = await db.task.update({
    where: { id: taskId },
    data: { status, completedAt: status === "COMPLETED" ? new Date() : null },
  });
  await logActivity(task.campaignId, "task_engine", `Tarefa "${task.title}" -> ${status}`, {
    taskId: task.id,
  });
  return task;
}
