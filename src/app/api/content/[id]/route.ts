import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { safeJson, jsonError } from "@/lib/api";
import { logActivity } from "@/lib/activityLog";
import { CONTENT_STATUSES } from "@/lib/types";

async function resolveApproval(campaignId: string, entityId: string, decision: "APPROVED" | "REJECTED") {
  const approval = await db.approval.findFirst({
    where: { campaignId, entityType: "content_item", entityId, status: "PENDING" },
  });
  if (approval) {
    await db.approval.update({
      where: { id: approval.id },
      data: { status: decision, decidedBy: "usuario", decidedAt: new Date() },
    });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await db.contentItem.findUnique({ where: { id } });
  if (!item) return jsonError("Conteúdo não encontrado", 404);

  const body = await safeJson<{
    action?: "approve" | "reject" | "archive" | "schedule";
    status?: string;
    body?: string;
    title?: string;
    hook?: string;
    cta?: string;
    rejectionNote?: string;
    scheduledAt?: string;
  }>(req);

  const data: Record<string, unknown> = {};

  if (body.title !== undefined) data.title = body.title;
  if (body.hook !== undefined) data.hook = body.hook;
  if (body.body !== undefined) data.body = body.body;
  if (body.cta !== undefined) data.cta = body.cta;
  if (body.scheduledAt !== undefined) data.scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null;

  if (body.action === "approve") {
    data.status = "APPROVED";
  } else if (body.action === "reject") {
    data.status = "REJECTED";
    data.rejectionNote = body.rejectionNote;
  } else if (body.action === "archive") {
    data.status = "ARCHIVED";
  } else if (body.action === "schedule") {
    data.status = "SCHEDULED";
  } else if (body.status && CONTENT_STATUSES.includes(body.status as (typeof CONTENT_STATUSES)[number])) {
    data.status = body.status;
  }

  const updated = await db.contentItem.update({ where: { id }, data });

  if (body.action === "approve" || body.action === "reject") {
    await resolveApproval(item.campaignId, item.id, body.action === "approve" ? "APPROVED" : "REJECTED");
    await logActivity(
      item.campaignId,
      "usuario",
      `${body.action === "approve" ? "Aprovou" : "Rejeitou"} conteúdo "${item.title}"`,
      { contentItemId: item.id }
    );
  }

  return NextResponse.json({ item: updated });
}
