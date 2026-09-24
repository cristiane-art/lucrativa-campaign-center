import { describe, it, expect } from "vitest";
import { checkCampaignCompleteness } from "@/lib/completeness";
import { makeCampaign } from "./factories";

describe("CampaignCompletenessChecker", () => {
  it("marca tudo como pendente numa campanha recém-criada", () => {
    const result = checkCampaignCompleteness(makeCampaign({ name: "" }));
    expect(result.complete).toBe(false);
    expect(result.missing).toContain("name");
    expect(result.missing).toContain("primaryObjective");
    expect(result.missing).toContain("audience");
    expect(result.missing).toContain("eventDate");
  });

  it("não pede local quando o formato é online", () => {
    const campaign = makeCampaign({
      name: "Evento",
      primaryObjective: "LOTAR_EVENTO",
      audience: "produtores",
      channels: JSON.stringify(["instagram"]),
      cta: "Inscreva-se",
      eventDate: new Date(),
      eventFormat: "online",
      eventCapacity: 100,
      region: "MT",
      targetResult: 100,
      budgetRangeLabel: "SEM_ORCAMENTO_PAGO",
    });
    const result = checkCampaignCompleteness(campaign);
    expect(result.missing).not.toContain("eventLocation");
  });

  it("exige local quando o formato é presencial", () => {
    const campaign = makeCampaign({
      campaignType: "evento",
      eventFormat: "presencial",
      eventLocation: null,
    });
    const result = checkCampaignCompleteness(campaign);
    expect(result.missing).toContain("eventLocation");
  });

  it("exige preço só quando o evento é pago", () => {
    const gratuito = makeCampaign({ eventIsPaid: false, eventPrice: null });
    expect(checkCampaignCompleteness(gratuito).missing).not.toContain("eventPrice");

    const pago = makeCampaign({ eventIsPaid: true, eventPrice: null });
    expect(checkCampaignCompleteness(pago).missing).toContain("eventPrice");
  });

  it("nunca inventa meta/orçamento — 'não sei' vira recommended, não missing", () => {
    const campaign = makeCampaign({
      name: "Evento",
      primaryObjective: "LOTAR_EVENTO",
      audience: "produtores",
      channels: JSON.stringify(["instagram"]),
      cta: "Inscreva-se",
      eventDate: new Date(),
      eventFormat: "online",
      eventCapacity: 100,
      region: "MT",
      targetResult: null,
      budgetRangeLabel: null,
      briefingExtra: JSON.stringify({ unknownFields: ["targetResult", "budget"] }),
    });
    const result = checkCampaignCompleteness(campaign);
    expect(result.missing).not.toContain("targetResult");
    expect(result.missing).not.toContain("budget");
    expect(result.recommended).toContain("targetResult");
    expect(result.recommended).toContain("budget");
    // com tudo mais preenchido e só recommended pendente, a campanha está "complete"
    expect(result.complete).toBe(true);
  });

  it("campanha totalmente preenchida é complete", () => {
    const campaign = makeCampaign({
      name: "Evento Lucrattiva Agro",
      primaryObjective: "LOTAR_EVENTO",
      audience: "produtores rurais",
      region: "Nova Mutum",
      channels: JSON.stringify(["instagram", "whatsapp"]),
      cta: "Inscreva-se",
      eventDate: new Date("2026-10-14"),
      eventFormat: "presencial",
      eventLocation: "Espaço de Eventos",
      eventCapacity: 150,
      eventIsPaid: false,
      targetResult: 150,
      budgetRangeLabel: "SEM_ORCAMENTO_PAGO",
    });
    const result = checkCampaignCompleteness(campaign);
    expect(result.complete).toBe(true);
    expect(result.missing).toHaveLength(0);
  });
});
