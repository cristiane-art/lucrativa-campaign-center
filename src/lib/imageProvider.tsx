import { ImageResponse } from "next/og";
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

// Adaptador "stock" — busca uma foto real no Pixabay (banco gratuito) que
// combine com o tema da peça e monta a arte final por cima (overlay de
// marca + título), com a mesma técnica de composição usada em
// opengraph-image.tsx. Ativado só quando IMAGE_PROVIDER=stock e
// PIXABAY_API_KEY estão definidos.

const STOCK_QUERY_POOL = [
  "soybean field aerial sunset",
  "wheat harvest combine golden hour",
  "farmer using tablet in field",
  "agribusiness meeting outdoors",
  "tractor plowing field sunrise",
  "rural landscape green plantation aerial",
  "corn field aerial drone",
  "farmer handshake deal agriculture",
];

// Palavras-chave em PT-BR comuns nos títulos gerados pelo Content Agent,
// mapeadas pra termos de busca em inglês (o Pixabay indexa melhor em inglês).
const STOCK_QUERY_KEYWORDS: Record<string, string> = {
  colheita: "harvest combine field",
  plantação: "crop field aerial farm",
  gestão: "farm business meeting",
  planejamento: "farm business meeting planning",
  networking: "people talking outdoors agriculture",
  lucratividade: "agribusiness success field",
  tecnologia: "precision agriculture drone technology",
  custo: "farm finance calculator field",
  churrasco: "barbecue outdoor gathering",
};

function pickStockQuery(brief: VisualBrief): string {
  const text = `${brief.headline} ${brief.notes ?? ""}`.toLowerCase();
  for (const [keyword, query] of Object.entries(STOCK_QUERY_KEYWORDS)) {
    if (text.includes(keyword)) return query;
  }
  // Sem palavra-chave reconhecida: escolhe de forma determinística (o mesmo
  // brief sempre cai na mesma foto) em vez de aleatório.
  const hash = [...text].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return STOCK_QUERY_POOL[hash % STOCK_QUERY_POOL.length];
}

function dimsForFormat(format: string): { width: number; height: number; orientation: "landscape" | "portrait" | "square" } {
  switch (format) {
    case "story":
    case "reel":
      return { width: 1080, height: 1920, orientation: "portrait" };
    case "flyer":
      return { width: 1200, height: 1600, orientation: "portrait" };
    case "banner":
      return { width: 1200, height: 630, orientation: "landscape" };
    default: // feed, carrossel, anuncio
      return { width: 1080, height: 1080, orientation: "square" };
  }
}

async function fetchStockPhotoUrl(query: string, orientation: "landscape" | "portrait" | "square"): Promise<string> {
  const apiKey = process.env.PIXABAY_API_KEY;
  if (!apiKey) throw new Error("PIXABAY_API_KEY não configurada para o provedor 'stock'.");

  // Pixabay só aceita "horizontal" ou "vertical" (sem opção "square") —
  // pro formato quadrado usamos horizontal e cortamos com object-fit: cover.
  const pixabayOrientation = orientation === "portrait" ? "vertical" : "horizontal";
  const url = `https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent(query)}&image_type=photo&orientation=${pixabayOrientation}&safesearch=true&per_page=3`;
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Pixabay retornou erro ${res.status}: ${body}`);
  }

  const data = (await res.json()) as { hits: Array<{ largeImageURL: string }> };
  const photo = data.hits?.[0];
  if (!photo) throw new Error(`Nenhuma foto encontrada no Pixabay para "${query}".`);
  return photo.largeImageURL;
}

async function generateStock(brief: VisualBrief): Promise<GeneratedImage> {
  const { width, height, orientation } = dimsForFormat(brief.format);
  const query = pickStockQuery(brief);
  const photoUrl = await fetchStockPhotoUrl(query, orientation);

  const response = new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photoUrl}
          width={width}
          height={height}
          style={{ position: "absolute", inset: 0, objectFit: "cover" }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            background:
              "linear-gradient(180deg, rgba(12,32,21,0.10) 0%, rgba(12,32,21,0.45) 55%, rgba(12,32,21,0.92) 100%)",
          }}
        />
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            width: "100%",
            height: "100%",
            padding: 64,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: BRAND.colors.amber,
            }}
          >
            {BRAND.fullName} · Agribusiness
          </div>
          <div style={{ display: "flex", marginTop: 16, fontSize: 52, fontWeight: 700, color: "#ffffff", lineHeight: 1.15 }}>
            {brief.headline}
          </div>
          {brief.subheadline && (
            <div style={{ display: "flex", marginTop: 18, fontSize: 26, color: "#f6f1e3" }}>{brief.subheadline}</div>
          )}
        </div>
      </div>
    ),
    { width, height }
  );

  const buffer = Buffer.from(await response.arrayBuffer());
  return { url: `data:image/png;base64,${buffer.toString("base64")}`, provider: "stock" };
}

export async function generateImage(brief: VisualBrief): Promise<GeneratedImage> {
  const provider = (process.env.IMAGE_PROVIDER || "").trim().toLowerCase();
  if (provider === "openai") return generateOpenAI(brief);
  if (provider === "stock") return generateStock(brief);
  if (provider && provider !== "mock") {
    throw new Error(`IMAGE_PROVIDER="${provider}" não é suportado. Use "openai", "stock" ou deixe em branco para o modo mock.`);
  }
  return generateMock(brief);
}
