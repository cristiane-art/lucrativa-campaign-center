import { describe, it, expect, beforeAll } from "vitest";
import { db } from "@/lib/db";
import { updateCampaignFromWizard } from "@/lib/campaignUpdate";
import { serializeCampaign } from "@/lib/serialize";

// Regressão: o wizard salva o briefing em etapas (patches parciais). Depois
// de várias chamadas, campos de briefingExtra preenchidos numa etapa
// anterior (ex: topics) não podem desaparecer quando outra etapa (ex:
// motivationProblem) é salva — e o formato devolvido ao cliente precisa
// estar sempre serializado (arrays/objetos reais, nunca a string JSON crua).
describe("updateCampaignFromWizard — persistência incremental do briefing", () => {
  let campaignId: string;

  beforeAll(async () => {
    const client = await db.client.create({ data: { slug: `t-wizard-${Date.now()}`, name: "Cliente Wizard" } });
    const campaign = await db.campaign.create({
      data: { clientId: client.id, name: "Campanha Wizard", campaignType: "evento" },
    });
    campaignId = campaign.id;
  });

  it("preserva topics ao salvar motivationProblem numa chamada separada", async () => {
    await updateCampaignFromWizard(campaignId, { briefingExtra: { topics: ["Reforma Tributária"] } });
    const afterSecondPatch = await updateCampaignFromWizard(campaignId, {
      briefingExtra: { motivationProblem: "Entender a reforma" },
    });

    const serialized = serializeCampaign(afterSecondPatch);
    expect(serialized.briefingExtra.topics).toEqual(["Reforma Tributária"]);
    expect(serialized.briefingExtra.motivationProblem).toBe("Entender a reforma");
  });

  it("serializeCampaign nunca deixa campos array como undefined", async () => {
    const campaign = await db.campaign.findUniqueOrThrow({ where: { id: campaignId } });
    const serialized = serializeCampaign(campaign);
    expect(Array.isArray(serialized.briefingExtra.topics)).toBe(true);
    expect(Array.isArray(serialized.briefingExtra.speakers)).toBe(true);
    expect(Array.isArray(serialized.channels)).toBe(true);
  });

  it("marcar um campo como 'não sei' entra em unknownFields sem apagar outros valores", async () => {
    await updateCampaignFromWizard(campaignId, { briefingExtra: { unknownFields: ["targetResult"] } });
    const updated = await updateCampaignFromWizard(campaignId, { name: "Campanha Wizard Renomeada" });
    const serialized = serializeCampaign(updated);
    expect(serialized.briefingExtra.unknownFields).toContain("targetResult");
    expect(serialized.briefingExtra.topics).toEqual(["Reforma Tributária"]);
    expect(serialized.name).toBe("Campanha Wizard Renomeada");
  });
});
