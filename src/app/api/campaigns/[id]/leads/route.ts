import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { safeJson, jsonError } from "@/lib/api";
import { logActivity } from "@/lib/activityLog";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const leads = await db.lead.findMany({
    where: { campaignId: id },
    orderBy: { createdAt: "desc" },
    include: { registrations: true },
  });
  return NextResponse.json({ leads });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await safeJson<{ name: string; phone?: string; email?: string; city?: string; source?: string }>(req);
  if (!body.name?.trim()) return jsonError("name é obrigatório");

  const lead = await db.lead.create({
    data: {
      campaignId: id,
      name: body.name.trim(),
      phone: body.phone,
      email: body.email,
      city: body.city,
      source: body.source || "manual",
    },
  });
  await logActivity(id, "usuario", `Adicionou lead manualmente: ${lead.name}`, { leadId: lead.id });
  return NextResponse.json({ lead }, { status: 201 });
}
