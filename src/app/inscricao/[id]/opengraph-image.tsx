import { ImageResponse } from "next/og";
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

export default async function OgImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = await db.campaign.findUnique({ where: { id } });

  const name = campaign?.name ?? "Evento";
  const dateLabel = formatEventDate(campaign?.eventDate ?? null);
  const location = campaign?.eventLocation ?? null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: `linear-gradient(160deg, #0c2015 0%, ${BRAND.colors.accentStrong} 45%, ${BRAND.colors.accent} 100%)`,
          padding: "80px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: BRAND.colors.amber,
          }}
        >
          {BRAND.fullName} · Agribusiness
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 28,
            fontSize: 68,
            fontWeight: 700,
            color: "#ffffff",
            lineHeight: 1.15,
            maxWidth: 980,
          }}
        >
          {name}
        </div>
        {(dateLabel || location) && (
          <div
            style={{
              display: "flex",
              marginTop: 40,
              gap: 20,
              fontSize: 30,
              color: "#f6f1e3",
            }}
          >
            {dateLabel && <div style={{ display: "flex" }}>{dateLabel}</div>}
            {dateLabel && location && <div style={{ display: "flex" }}>·</div>}
            {location && <div style={{ display: "flex" }}>{location}</div>}
          </div>
        )}
      </div>
    ),
    { ...size }
  );
}
