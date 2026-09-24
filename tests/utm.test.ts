import { describe, it, expect } from "vitest";
import { buildUtmUrl, buildShortUrl, generateShortCode } from "@/lib/utm";

describe("Tracking Agent — UTM e código curto (cálculo puro, sem LLM)", () => {
  it("monta a URL com os parâmetros utm corretos", () => {
    const url = buildUtmUrl({
      destinationUrl: "https://exemplo.com/inscricao",
      source: "Instagram",
      medium: "social",
      campaignTag: "Evento Lucrattiva Agro",
      content: "flyer",
    });
    const parsed = new URL(url);
    expect(parsed.searchParams.get("utm_source")).toBe("instagram");
    expect(parsed.searchParams.get("utm_medium")).toBe("social");
    expect(parsed.searchParams.get("utm_campaign")).toBe("evento_lucrattiva_agro");
    expect(parsed.searchParams.get("utm_content")).toBe("flyer");
  });

  it("omite utm_content quando não informado", () => {
    const url = buildUtmUrl({
      destinationUrl: "https://exemplo.com",
      source: "whatsapp",
      medium: "message",
      campaignTag: "campanha",
    });
    expect(new URL(url).searchParams.has("utm_content")).toBe(false);
  });

  it("preserva outros query params já existentes no destino", () => {
    const url = buildUtmUrl({
      destinationUrl: "https://exemplo.com/pagina?ref=abc",
      source: "google",
      medium: "cpc",
      campaignTag: "c",
    });
    expect(new URL(url).searchParams.get("ref")).toBe("abc");
  });

  it("gera código curto sem caracteres ambíguos e com tamanho estável", () => {
    const codes = new Set(Array.from({ length: 200 }, () => generateShortCode()));
    expect(codes.size).toBe(200); // sem colisão em 200 gerações
    for (const c of codes) {
      expect(c).toHaveLength(7);
      expect(c).not.toMatch(/[0O1lI]/);
    }
  });

  it("monta a URL curta a partir do código", () => {
    expect(buildShortUrl("http://localhost:3000/", "abc1234")).toBe("http://localhost:3000/r/abc1234");
    expect(buildShortUrl("http://localhost:3000", "abc1234")).toBe("http://localhost:3000/r/abc1234");
  });
});
