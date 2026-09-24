import { NextResponse } from "next/server";
import { safeJson, jsonError } from "@/lib/api";
import { updateTaskStatus } from "@/lib/taskEngine";
import { TASK_STATUSES } from "@/lib/types";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await safeJson<{ status: string }>(req);
  if (!TASK_STATUSES.includes(body.status as (typeof TASK_STATUSES)[number])) {
    return jsonError(`status inválido: ${body.status}`);
  }
  const task = await updateTaskStatus(id, body.status as (typeof TASK_STATUSES)[number]);
  return NextResponse.json({ task });
}
