import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { safeJson, jsonError } from "@/lib/api";
import { logActivity } from "@/lib/activityLog";

// Inscrição pública de evento — seção 18/19 do spec. Coleta o mínimo
// necessário (nome + um contato), nunca campos extras (princípio de
// minimização de dados / LGPD).
export async function POST(req: Request) {
  const body = await safeJson<{
    campaignId: string;
    name: string;
    phone?: string;
    email?: string;
    city?: string;
    source?: string;
  }>(req);

  if (!body.campaignId) return jsonError("campaignId é obrigatório");
  if (!body.name?.trim()) return jsonError("name é obrigatório");
  if (!body.phone?.trim() && !body.email?.trim()) return jsonError("informe telefone ou e-mail");

  const campaign = await db.campaign.findUnique({ where: { id: body.campaignId } });
  if (!campaign) return jsonError("Campanha não encontrada", 404);

  const orConditions: Prisma.LeadWhereInput[] = [];
  if (body.email) orConditions.push({ email: body.email });
  if (body.phone) orConditions.push({ phone: body.phone });

  let lead = await db.lead.findFirst({
    where: { campaignId: body.campaignId, OR: orConditions },
  });

  if (lead) {
    lead = await db.lead.update({
      where: { id: lead.id },
      data: { status: "REGISTERED", name: body.name.trim(), city: body.city ?? lead.city },
    });
  } else {
    lead = await db.lead.create({
      data: {
        campaignId: body.campaignId,
        name: body.name.trim(),
        phone: body.phone,
        email: body.email,
        city: body.city,
        source: body.source || "landing_page",
        status: "REGISTERED",
      },
    });
  }

  const registration = await db.registration.create({
    data: {
      campaignId: body.campaignId,
      leadId: lead.id,
      source: body.source || "landing_page",
      status: "REGISTERED",
    },
  });

  await logActivity(body.campaignId, "sistema", `Nova inscrição: ${lead.name}`, {
    leadId: lead.id,
    registrationId: registration.id,
  });

  return NextResponse.json({ registration, lead }, { status: 201 });
}
