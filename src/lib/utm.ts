import { customAlphabet } from "nanoid";

// Tracking Agent — geração de UTM e código curto. Regra fundamental (seção
// 38 do spec): UTM/QR são cálculo determinístico, nunca passam por LLM.

const shortCodeAlphabet = customAlphabet(
  "23456789abcdefghjkmnpqrstuvwxyz", // sem caracteres ambíguos (0/O, 1/l/I)
  7
);

export function generateShortCode(): string {
  return shortCodeAlphabet();
}

function slugifyForUtm(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60);
}

export interface BuildUtmUrlInput {
  destinationUrl: string;
  source: string;
  medium: string;
  campaignTag: string;
  content?: string | null;
}

export function buildUtmUrl({
  destinationUrl,
  source,
  medium,
  campaignTag,
  content,
}: BuildUtmUrlInput): string {
  const url = new URL(destinationUrl);
  url.searchParams.set("utm_source", slugifyForUtm(source));
  url.searchParams.set("utm_medium", slugifyForUtm(medium));
  url.searchParams.set("utm_campaign", slugifyForUtm(campaignTag));
  if (content) url.searchParams.set("utm_content", slugifyForUtm(content));
  return url.toString();
}

export function buildShortUrl(baseUrl: string, shortCode: string): string {
  return `${baseUrl.replace(/\/$/, "")}/r/${shortCode}`;
}
