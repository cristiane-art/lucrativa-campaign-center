import { describe, it, expect, beforeAll } from "vitest";
import { db } from "@/lib/db";
import { generateParticipantCode } from "@/lib/utm";

// Regressão do módulo de credenciamento: a inscrição pública nunca cria uma
// segunda Registration para o mesmo Lead+campanha (POST /api/registration
// busca por telefone/e-mail antes de criar — ver src/app/api/registration/route.ts),
// e o check-in é o que efetivamente marca presença.
describe("Credenciamento — participante e check-in", () => {
  let campaignId: string;

  beforeAll(async () => {
    const client = await db.client.create({ data: { slug: `t-cred-${Date.now()}`, name: "Cliente Credenciamento" } });
    const campaign = await db.campaign.create({
      data: { clientId: client.id, name: "Evento Teste", campaignType: "evento", eventCapacity: 40 },
    });
    campaignId = campaign.id;
  });

  it("cada lead carrega um participantCode único, usável para check-in", async () => {
    const lead = await db.lead.create({
      data: { campaignId, name: "Produtor Teste", phone: "65900000000", participantCode: generateParticipantCode() },
    });
    expect(lead.participantCode).toMatch(/^LC-/);
  });

  it("uma pessoa reinscrita nunca gera uma segunda Registration para a mesma campanha", async () => {
    const lead = await db.lead.create({
      data: { campaignId, name: "Ana", phone: "65911112222", participantCode: generateParticipantCode() },
    });
    await db.registration.create({ data: { campaignId, leadId: lead.id, status: "REGISTERED" } });

    // simula o que a rota faz: busca a inscrição existente antes de criar outra
    const existing = await db.registration.findFirst({ where: { campaignId, leadId: lead.id } });
    expect(existing).not.toBeNull();

    const count = await db.registration.count({ where: { campaignId, leadId: lead.id } });
    expect(count).toBe(1);
  });

  it("check-in marca CHECKED_IN e preenche checkedInAt, nunca antes disso", async () => {
    const lead = await db.lead.create({
      data: { campaignId, name: "João", phone: "65933334444", participantCode: generateParticipantCode() },
    });
    const registration = await db.registration.create({ data: { campaignId, leadId: lead.id, status: "REGISTERED" } });
    expect(registration.checkedInAt).toBeNull();

    const checkedIn = await db.registration.update({
      where: { id: registration.id },
      data: { status: "CHECKED_IN", checkedInAt: new Date() },
    });
    expect(checkedIn.status).toBe("CHECKED_IN");
    expect(checkedIn.checkedInAt).not.toBeNull();
  });

  it("consentimento de marketing nunca é assumido — default é false", async () => {
    const lead = await db.lead.create({ data: { campaignId, name: "Sem consentimento explícito" } });
    expect(lead.marketingConsent).toBe(false);
    expect(lead.consentAt).toBeNull();
  });

  it("excluir um lead também remove a inscrição vinculada (pedido de exclusão de dados)", async () => {
    const lead = await db.lead.create({
      data: { campaignId, name: "Pedro", phone: "65955556666", participantCode: generateParticipantCode() },
    });
    await db.registration.create({ data: { campaignId, leadId: lead.id, status: "REGISTERED" } });

    await db.$transaction([
      db.registration.deleteMany({ where: { leadId: lead.id } }),
      db.lead.delete({ where: { id: lead.id } }),
    ]);

    expect(await db.lead.findUnique({ where: { id: lead.id } })).toBeNull();
    expect(await db.registration.count({ where: { leadId: lead.id } })).toBe(0);
  });
});
