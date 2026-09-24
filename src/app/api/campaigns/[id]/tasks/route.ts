import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { safeJson } from "@/lib/api";
import { createTask } from "@/lib/taskEngine";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tasks = await db.task.findMany({
    where: { campaignId: id },
    orderBy: [{ status: "asc" }, { priority: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json({ tasks });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await safeJson<{
    title: string;
    description?: string;
    type?: string;
    priority?: "ALTA" | "MEDIA" | "BAIXA";
    assignedTo?: string;
  }>(req);

  const task = await createTask({
    campaignId: id,
    title: body.title,
    description: body.description,
    type: body.type || "other",
    priority: body.priority,
    assignedTo: body.assignedTo || "equipe",
    automationLevel: "HUMAN",
  });

  return NextResponse.json({ task }, { status: 201 });
}
