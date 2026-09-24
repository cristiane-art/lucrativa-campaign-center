import { describe, it, expect } from "vitest";
import { db } from "@/lib/db";
import { checkCampaignCompleteness } from "@/lib/completeness";

describe("Campaign — criação e isolamento por client_id", () => {
  it("cria uma campanha vinculada ao client_id e começa em DISCOVERY", async () => {
    const client = await db.client.create({ data: { slug: `t-${Date.now()}-a`, name: "Cliente A" } });
    const campaign = await db.campaign.create({
      data: { clientId: client.id, name: "Campanha A", campaignType: "evento" },
    });
    expect(campaign.status).toBe("DISCOVERY");
    expect(campaign.clientId).toBe(client.id);
  });

  it("nunca vaza campanha de um cliente para outro (isolamento multi-tenant)", async () => {
    const clientA = await db.client.create({ data: { slug: `t-${Date.now()}-b1`, name: "Cliente B1" } });
    const clientB = await db.client.create({ data: { slug: `t-${Date.now()}-b2`, name: "Cliente B2" } });

    await db.campaign.create({ data: { clientId: clientA.id, name: "Só de A", campaignType: "evento" } });
    await db.campaign.create({ data: { clientId: clientB.id, name: "Só de B", campaignType: "evento" } });

    const campaignsOfA = await db.campaign.findMany({ where: { clientId: clientA.id } });
    const campaignsOfB = await db.campaign.findMany({ where: { clientId: clientB.id } });

    expect(campaignsOfA.every((c) => c.clientId === clientA.id)).toBe(true);
    expect(campaignsOfB.some((c) => c.name === "Só de A")).toBe(false);
    expect(campaignsOfA.some((c) => c.name === "Só de B")).toBe(false);
  });

  it("getOrCreateDefaultClient é idempotente (upsert, sem corrida)", async () => {
    const { getOrCreateDefaultClient } = await import("@/lib/tenant");
    process.env.SEED_CLIENT_SLUG = `t-idempotent-${Date.now()}`;
    const [a, b] = await Promise.all([getOrCreateDefaultClient(), getOrCreateDefaultClient()]);
    expect(a.id).toBe(b.id);
  });

  it("não inventa campos obrigatórios ao criar — completeness reflete o que falta de verdade", async () => {
    const client = await db.client.create({ data: { slug: `t-${Date.now()}-c`, name: "Cliente C" } });
    const campaign = await db.campaign.create({
      data: { clientId: client.id, name: "Campanha sem briefing", campaignType: "evento" },
    });
    const completeness = checkCampaignCompleteness(campaign);
    expect(completeness.complete).toBe(false);
    expect(completeness.missing.length).toBeGreaterThan(0);
  });
});
