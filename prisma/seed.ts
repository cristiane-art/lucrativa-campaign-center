import { PrismaClient } from "@prisma/client";
import { BRAND } from "../src/lib/brand";
import { checkCampaignCompleteness } from "../src/lib/completeness";
import type { CampaignBriefingExtra } from "../src/lib/types";

const db = new PrismaClient();

// Seed: cria o tenant Lucrattiva e atualiza a campanha do evento com os
// dados reais do briefing de credenciamento (14/10/2026, "O Novo Preço de
// Produzir", Condomínio Village). Só preenche o que foi EXPLICITAMENTE
// informado — orçamento, preço do ingresso e a mecânica exata do
// diagnóstico ficam em aberto de propósito (REGRA 10/11): viram tarefa em
// vez de valor inventado.
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

  let campaign = await db.campaign.findFirst({
    where: { clientId: client.id, name: { in: ["Evento Lucrativa Agro", "O Novo Preço de Produzir"] } },
  });

  const briefingExtra: Partial<CampaignBriefingExtra> = {
    speakers: [
      {
        name: "Cristiane Dartora",
        specialty: "Custo de produzir para PJ, produtores de insumos e outros participantes relacionados",
      },
      {
        name: "Cristiane Lantin",
        specialty: "Custo de produzir para o produtor rural",
      },
      {
        name: "Aline",
        topicPending: true,
      },
    ],
    topics: [
      "Novo custo de produção",
      "Cenário e decisões futuras",
      "Eficiência e lucratividade",
      "Gestão e planejamento",
      "Impacto nas operações",
    ],
    motivationProblem:
      "Entender como o cenário está mudando — e como isso pode afetar a operação — antes que as mudanças cheguem.",
    schedule: [
      { time: "18:30", label: "Início da roda de conversa" },
      { time: "20:00", label: "Perguntas e encerramento da parte principal" },
      { time: "20:30", label: "Churrasco" },
      { time: "20:30 – 21:30", label: "Networking e encerramento" },
    ],
    valuePropositionBullets: [
      "Visão de profissionais com mais de 20 anos de experiência no agro",
      "Entenda o cenário futuro antes das mudanças chegarem até você",
      "Tome decisões mais assertivas para sua operação",
      "Identifique oportunidades reais de melhorar a lucratividade",
      "Converse diretamente com quem vive o dia a dia do setor",
      "Networking qualificado, num grupo pequeno e exclusivo",
    ],
    audienceExamples: [
      "Produtores rurais",
      "Agrônomos",
      "Gestores de propriedades",
      "Empresários do agro",
      "Profissionais que participam ou influenciam decisões dentro das fazendas",
    ],
    networkingHighlight: "20:30 · Churrasco e networking",
    diagnosticDescription:
      "Ao longo da conversa, você pode receber um diagnóstico gratuito da situação atual da sua operação.",
    diagnosticPending: true, // mecânica exata ainda não confirmada — nunca inventar
    unknownFields: ["targetResult", "budget", "eventIsPaid"],
  };

  const data = {
    clientId: client.id,
    name: "O Novo Preço de Produzir",
    description: "Roda de conversa exclusiva da Lucrattiva sobre o novo cenário de produção no agro.",
    campaignType: "evento",
    primaryObjective: "FORTALECER_MARCA",
    secondaryObjectives: JSON.stringify(["RELACIONAMENTO_CLIENTES", "GERAR_LEADS"]),
    eventDate: new Date("2026-10-14T00:00:00.000Z"),
    eventTime: "18:30 às 21:30",
    eventLocation: "Condomínio Village",
    eventFormat: "presencial",
    eventCapacity: 40,
    audience:
      "Agrônomos, gestores de propriedades, produtores rurais, empresários do agro e profissionais que participam ou influenciam decisões dentro das propriedades",
    region: "Nova Mutum e região",
    valueProposition:
      "Uma roda de conversa exclusiva e personalizada — não uma palestra genérica — com profissionais de mais de 20 anos de experiência, para entender o novo cenário de produção e tomar decisões mais assertivas.",
    landingSubtitle: "Uma conversa exclusiva sobre o novo cenário de produção, decisões e lucratividade no agro.",
    cta: "Quero participar",
    channels: JSON.stringify(["instagram", "whatsapp", "parceiros"]),
    briefingExtra: JSON.stringify(briefingExtra),
  };

  if (campaign) {
    campaign = await db.campaign.update({ where: { id: campaign.id }, data });
    console.log(`Campanha atualizada: ${campaign.name} (${campaign.id})`);
  } else {
    campaign = await db.campaign.create({ data: { ...data, status: "DISCOVERY" } });
    console.log(`Campanha criada: ${campaign.name} (${campaign.id})`);
  }

  const completeness = checkCampaignCompleteness(campaign);
  await db.campaign.update({
    where: { id: campaign.id },
    data: {
      briefingMissing: JSON.stringify(completeness.missing),
      briefingComplete: completeness.complete,
    },
  });
  console.log(`Pendências obrigatórias restantes: ${completeness.missing.join(", ") || "nenhuma"}`);

  // Pendências explícitas do briefing — nunca inventadas, viram tarefa humana.
  const pendingTasks = [
    {
      title: "Confirmar sobrenome e tema da palestra da Aline",
      description: "O briefing do evento não definiu o tema dela ainda — não inventar.",
    },
    {
      title: "Confirmar exatamente como funciona o diagnóstico gratuito",
      description: "Antes de divulgar detalhes do diagnóstico, confirmar a mecânica real com a equipe.",
    },
    {
      title: "Confirmar se o evento é gratuito ou pago",
      description: "Não assumido no briefing — necessário antes de finalizar a landing page.",
    },
  ];
  for (const t of pendingTasks) {
    const exists = await db.task.findFirst({ where: { campaignId: campaign.id, title: t.title } });
    if (!exists) {
      await db.task.create({
        data: {
          campaignId: campaign.id,
          title: t.title,
          description: t.description,
          type: "other",
          assignedTo: "equipe",
          priority: "ALTA",
          automationLevel: "HUMAN",
        },
      });
    }
  }

  console.log("Seed concluído.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
