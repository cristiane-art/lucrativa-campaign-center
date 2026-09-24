import { BRAND } from "./brand";

// Creative Agent — provedor de geração de imagem plugável (seção 10 do spec).
// REGRA 12: nunca fingir uma integração que não existe. Sem IMAGE_PROVIDER
// configurado, cai no modo MOCK (etiquetado como tal em todo lugar que a UI
// mostra a imagem) — que gera um placeholder de marca local, sem chamada
// externa. Ativar um provedor real é uma linha de .env; ver docs/integrations.md.

export interface VisualBrief {
  headline: string;
  subheadline?: string;
  format: string; // feed | story | carrossel | anuncio | flyer | banner
  notes?: string;
}

export interface GeneratedImage {
  url: string; // data URL (mock) ou URL do provedor real
  provider: string;
}

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]!));
}

function wrapText(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    if ((current + " " + w).trim().length > maxCharsPerLine) {
      if (current) lines.push(current.trim());
      current = w;
    } else {
      current = (current + " " + w).trim();
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 5);
}

function buildMockSvg(brief: VisualBrief): string {
  const isStory = brief.format === "story";
  const w = isStory ? 1080 : 1080;
  const h = isStory ? 1920 : 1080;
  const lines = wrapText(brief.headline, isStory ? 22 : 26);
  const lineHeight = 64;
  const startY = h / 2 - (lines.length * lineHeight) / 2;

  const textSpans = lines
    .map((line, i) => `<tspan x="${w / 2}" y="${startY + i * lineHeight}">${escapeXml(line)}</tspan>`)
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="${BRAND.colors.bg}" />
  <rect x="0" y="0" width="${w}" height="14" fill="${BRAND.colors.amber}" />
  <rect x="0" y="${h - 14}" width="${w}" height="14" fill="${BRAND.colors.accent}" />
  <circle cx="${w / 2}" cy="${h * 0.18}" r="46" fill="${BRAND.colors.accentStrong}" />
  <text x="${w / 2}" y="${h * 0.18 + 14}" font-family="Georgia, serif" font-size="34" fill="${BRAND.colors.amber}" text-anchor="middle" font-weight="bold">L</text>
  <text font-family="Georgia, serif" font-size="48" fill="${BRAND.colors.accentStrong}" text-anchor="middle" font-weight="600">${textSpans}</text>
  ${brief.subheadline ? `<text x="${w / 2}" y="${startY + lines.length * lineHeight + 56}" font-family="system-ui, sans-serif" font-size="28" fill="${BRAND.colors.amber}" text-anchor="middle">${escapeXml(brief.subheadline)}</text>` : ""}
  <text x="${w / 2}" y="${h - 48}" font-family="system-ui, sans-serif" font-size="24" fill="${BRAND.colors.accentStrong}" text-anchor="middle" letter-spacing="2">LUCRATTIVA CONTABILIDADE · AGRIBUSINESS</text>
  <text x="${w - 24}" y="${h - 20}" font-family="system-ui, sans-serif" font-size="16" fill="${BRAND.colors.accentStrong}" opacity="0.5" text-anchor="end">MOCK — sem provedor de imagem configurado</text>
</svg>`;
}

async function generateMock(brief: VisualBrief): Promise<GeneratedImage> {
  const svg = buildMockSvg(brief);
  const base64 = Buffer.from(svg, "utf-8").toString("base64");
  return { url: `data:image/svg+xml;base64,${base64}`, provider: "mock" };
}

// Adaptador para OpenAI Images API (gpt-image-1) — ativado só quando
// IMAGE_PROVIDER=openai e IMAGE_PROVIDER_API_KEY estão definidos. Não foi
// exercitado contra uma chave real nesta sessão (sem acesso de rede para
// testar) — confira a resposta da API ao ativar pela primeira vez.
async function generateOpenAI(brief: VisualBrief): Promise<GeneratedImage> {
  const apiKey = process.env.IMAGE_PROVIDER_API_KEY;
  if (!apiKey) throw new Error("IMAGE_PROVIDER_API_KEY não configurada para o provedor 'openai'.");

  const prompt = [
    `Peça de marketing (${brief.format}) para a Lucrattiva Contabilidade, agribusiness.`,
    `Identidade visual: verde institucional ${BRAND.colors.accent}, dourado ${BRAND.colors.amber}, fundo marfim ${BRAND.colors.bg}.`,
    `Texto principal: "${brief.headline}".`,
    brief.subheadline ? `Texto secundário: "${brief.subheadline}".` : "",
    brief.notes ?? "",
    "Estilo limpo, profissional, caloroso, elementos de agronegócio quando fizer sentido.",
  ]
    .filter(Boolean)
    .join(" ");

  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt,
      size: brief.format === "story" ? "1024x1536" : "1024x1024",
      n: 1,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Provedor de imagem 'openai' retornou erro ${res.status}: ${body}`);
  }

  const data = (await res.json()) as { data: Array<{ b64_json?: string; url?: string }> };
  const first = data.data?.[0];
  if (!first) throw new Error("Provedor de imagem 'openai' não retornou nenhuma imagem.");

  const url = first.url ?? (first.b64_json ? `data:image/png;base64,${first.b64_json}` : null);
  if (!url) throw new Error("Resposta do provedor de imagem 'openai' sem imagem utilizável.");

  return { url, provider: "openai" };
}

export async function generateImage(brief: VisualBrief): Promise<GeneratedImage> {
  const provider = (process.env.IMAGE_PROVIDER || "").trim().toLowerCase();
  if (provider === "openai") return generateOpenAI(brief);
  if (provider && provider !== "mock") {
    throw new Error(`IMAGE_PROVIDER="${provider}" não é suportado. Use "openai" ou deixe em branco para o modo mock.`);
  }
  return generateMock(brief);
}
