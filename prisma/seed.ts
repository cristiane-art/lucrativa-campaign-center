import { PrismaClient } from "@prisma/client";
import { BRAND } from "../src/lib/brand";
import { checkCampaignCompleteness } from "../src/lib/completeness";

const db = new PrismaClient();

// Seed mínimo: cria o tenant Lucrattiva e a campanha inicial descrita na
// seção 39 do briefing ("Evento Lucrativa Agro"). Só preenche o que foi
// EXPLICITAMENTE informado no briefing original — orçamento, capacidade,
// local e canais ficam em aberto de propósito (REGRA 10/11): o usuário
// completa isso pelo wizard/dashboard antes de confirmar a campanha.
async function main() {
  const slug = process.env.SEED_CLIENT_SLUG || "lucrattiva";
  const client = await db.client.upsert({
    where: { slug },
    update: {},
    create: {
      slug,
      name: process.env.SEED_CLIENT_NAME || BRAND.fullName,
      brandName: BRAND.name,
      brandPrimaryColor: BRAND.colors.accent,
      brandAccentColor: BRAND.colors.amber,
    },
  });
  console.log(`Client: ${client.name} (${client.id})`);

  const existing = await db.campaign.findFirst({
    where: { clientId: client.id, name: "Evento Lucrativa Agro" },
  });
  if (existing) {
    console.log(`Campanha "Evento Lucrativa Agro" já existe (${existing.id}) — nada a fazer.`);
    return;
  }

  const campaign = await db.campaign.create({
    data: {
      clientId: client.id,
      name: "Evento Lucrativa Agro",
      campaignType: "evento",
      status: "DISCOVERY",
      primaryObjective: "LOTAR_EVENTO",
      eventDate: new Date("2026-10-14T00:00:00.000Z"),
      audience: "Produtores rurais e profissionais do agro",
      region: "Nova Mutum e região",
    },
  });

  const completeness = checkCampaignCompleteness(campaign);
  await db.campaign.update({
    where: { id: campaign.id },
    data: { briefingMissing: JSON.stringify(completeness.missing) },
  });

  console.log(`Campanha criada: ${campaign.name} (${campaign.id})`);
  console.log(`Pendências (de propósito — completar pelo wizard): ${completeness.missing.join(", ")}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
