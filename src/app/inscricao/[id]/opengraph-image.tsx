import { ImageResponse } from "next/og";
import sharp from "sharp";
import { db } from "@/lib/db";
import { BRAND } from "@/lib/brand";

export const runtime = "nodejs";
export const alt = "Convite do evento";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function formatEventDate(date: Date | null) {
  if (!date) return null;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

// Satori (next/og) só resolve imagens por URL absoluta — sem isso, tanto o
// banner quanto a logo ficam quebrados na prévia de link.
function absoluteUrl(path: string) {
  if (/^https?:\/\//.test(path)) return path;
  const base = (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

// O decodificador de imagem do satori não lê WebP (o banner do evento é
// servido em .webp pra carregar rápido no celular) — sem isso, a foto
// simplesmente não aparece na prévia, sem erro nenhum. Converte pra PNG no
// servidor e embute como data URI, que o satori sempre consegue ler.
async function fetchAsPngDataUri(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    const png = await sharp(buffer).png().toBuffer();
    return `data:image/png;base64,${png.toString("base64")}`;
  } catch {
    return null;
  }
}

export default async function OgImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = await db.campaign.findUnique({ where: { id } });

  const name = campaign?.name ?? "Evento";
  const dateLabel = formatEventDate(campaign?.eventDate ?? null);
  const location = campaign?.eventLocation ?? null;
  const bannerUrl = campaign?.bannerImageUrl
    ? await fetchAsPngDataUri(absoluteUrl(campaign.bannerImageUrl))
    : null;
  const logoUrl = absoluteUrl("/logo-lucrattiva.png");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: `linear-gradient(160deg, #0c2015 0%, ${BRAND.colors.accentStrong} 45%, ${BRAND.colors.accent} 100%)`,
        }}
      >
        {bannerUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={bannerUrl}
            width={size.width}
            height={size.height}
            style={{ position: "absolute", top: 0, left: 0, objectFit: "cover" }}
          />
        )}
        {bannerUrl && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              display: "flex",
              background:
                "linear-gradient(160deg, rgba(12,32,21,0.55) 0%, rgba(12,32,21,0.78) 50%, rgba(12,32,21,0.95) 100%)",
            }}
          />
        )}

        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            height: "100%",
            padding: "70px",
            textAlign: "center",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoUrl} width={190} height={141} style={{ objectFit: "contain" }} />

          <div
            style={{
              display: "flex",
              marginTop: 26,
              fontSize: 24,
              fontWeight: 600,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: BRAND.colors.amber,
            }}
          >
            Convite exclusivo
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 20,
              fontSize: 58,
              fontWeight: 700,
              color: "#ffffff",
              lineHeight: 1.15,
              maxWidth: 980,
            }}
          >
            {name}
          </div>
          {(dateLabel || location) && (
            <div style={{ display: "flex", marginTop: 32, gap: 20, fontSize: 28, color: "#f6f1e3" }}>
              {dateLabel && <div style={{ display: "flex" }}>{dateLabel}</div>}
              {dateLabel && location && <div style={{ display: "flex" }}>·</div>}
              {location && <div style={{ display: "flex" }}>{location}</div>}
            </div>
          )}
        </div>
      </div>
    ),
    { ...size }
  );
}
