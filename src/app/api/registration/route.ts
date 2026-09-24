import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { safeJson, jsonError } from "@/lib/api";
import { logActivity } from "@/lib/activityLog";
import { generateParticipantCode } from "@/lib/utm";
import { CONSENT_VERSION } from "@/lib/types";

interface RegistrationBody {
  campaignId: string;
  name: string;
  phone?: string;
  email?: string;
  city?: string;
  company?: string;
  role?: string;
  segment?: string;
  agroRelation?: string;
  decisionInfluence?: boolean;
  isExistingClient?: string;
  diagnosticInterest?: string;
  marketingConsent?: boolean;
  source?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
}

// Inscrição pública de evento — coleta só o que o formulário pede (princípio
// de minimização de dados / LGPD). Consentimento de marketing é sempre
// opt-in explícito, nunca assumido pelo simples fato de a pessoa ter se
// inscrito no evento.
export async function POST(req: Request) {
  const body = await safeJson<RegistrationBody>(req);

  if (!body.campaignId) return jsonError("campaignId é obrigatório");
  if (!body.name?.trim()) return jsonError("name é obrigatório");
  if (!body.phone?.trim() && !body.email?.trim()) return jsonError("informe telefone ou e-mail");

  const campaign = await db.campaign.findUnique({ where: { id: body.campaignId } });
  if (!campaign) return jsonError("Campanha não encontrada", 404);

  const orConditions: Prisma.LeadWhereInput[] = [];
  if (body.email) orConditions.push({ email: body.email });
  if (body.phone) orConditions.push({ phone: body.phone });

  const existingLead = await db.lead.findFirst({
    where: { campaignId: body.campaignId, OR: orConditions },
  });
  const existingRegistration = existingLead
    ? await db.registration.findFirst({ where: { campaignId: body.campaignId, leadId: existingLead.id } })
    : null;

  const qualificationData = {
    name: body.name.trim(),
    city: body.city,
    company: body.company,
    role: body.role,
    segment: body.segment,
    agroRelation: body.agroRelation,
    decisionInfluence: body.decisionInfluence ?? null,
    isExistingClient: body.isExistingClient,
    diagnosticInterest: body.diagnosticInterest,
    marketingConsent: body.marketingConsent ?? false,
    consentVersion: CONSENT_VERSION,
    consentAt: new Date(),
  };

  // Já tinha inscrição para este evento: atualiza os dados (permitido pelo
  // fluxo) mas NUNCA cria um segundo registro — detecção por telefone/e-mail.
  if (existingLead && existingRegistration) {
    const lead = await db.lead.update({ where: { id: existingLead.id }, data: qualificationData });
    await logActivity(body.campaignId, "sistema", `Atualizou dados de inscrição já existente: ${lead.name}`, {
      leadId: lead.id,
      registrationId: existingRegistration.id,
    });
    return NextResponse.json({ registration: existingRegistration, lead, duplicate: true }, { status: 200 });
  }

  let lead = existingLead;
  if (lead) {
    lead = await db.lead.update({ where: { id: lead.id }, data: { ...qualificationData, status: "REGISTERED" } });
  } else {
    lead = await db.lead.create({
      data: {
        campaignId: body.campaignId,
        phone: body.phone,
        email: body.email,
        source: body.source || "landing_page",
        utmSource: body.utmSource,
        utmMedium: body.utmMedium,
        utmCampaign: body.utmCampaign,
        utmContent: body.utmContent,
        participantCode: generateParticipantCode(),
        status: "REGISTERED",
        ...qualificationData,
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

  await logActivity(body.campaignId, "sistema", `Nova inscrição: ${lead.name}${body.source ? ` (${body.source})` : ""}`, {
    leadId: lead.id,
    registrationId: registration.id,
  });

  return NextResponse.json({ registration, lead, duplicate: false }, { status: 201 });
}
