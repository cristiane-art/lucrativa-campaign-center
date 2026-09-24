"use client";

import { useState } from "react";
import { Chip, Label, Input } from "@/components/ui";
import { CHANNELS, ASSETS_AVAILABLE } from "@/lib/types";
import type { StepProps } from "./types";

const CHANNEL_LABELS: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  whatsapp: "WhatsApp",
  google: "Google",
  youtube: "YouTube",
  linkedin: "LinkedIn",
  email: "Email",
  radio: "Rádio",
  parceiros: "Parceiros",
  influenciadores: "Influenciadores",
  flyers: "Flyers",
  cartazes: "Cartazes",
  eventos_presenciais: "Eventos presenciais",
  outros: "Outros",
};

const ASSET_LABELS: Record<string, string> = {
  logo: "Logo",
  identidade_visual: "Identidade visual",
  fotos: "Fotos",
  videos: "Vídeos",
  fotos_palestrantes: "Fotos dos palestrantes",
  videos_palestrantes: "Vídeos dos palestrantes",
  material_institucional: "Material institucional",
  landing_page: "Landing page",
  lista_contatos: "Lista de contatos",
  instagram: "Instagram",
  facebook: "Facebook",
  whatsapp: "WhatsApp",
  outros: "Outros",
};

export function StepCanais({ campaign, patch }: StepProps) {
  const [cta, setCta] = useState(campaign.cta ?? "");
  const [ctaLink, setCtaLink] = useState(campaign.ctaLink ?? "");

  function toggle(list: string[], value: string, field: "channels" | "assetsAvailable") {
    const set = new Set(list);
    if (set.has(value)) set.delete(value);
    else set.add(value);
    patch({ [field]: Array.from(set) });
  }

  return (
    <div className="space-y-5">
      <div>
        <Label>Quais canais vocês podem utilizar?</Label>
        <div className="flex flex-wrap gap-2">
          {CHANNELS.map((c) => (
            <Chip key={c} label={CHANNEL_LABELS[c]} selected={campaign.channels.includes(c)} onClick={() => toggle(campaign.channels, c, "channels")} />
          ))}
        </div>
      </div>

      <div>
        <Label>Quais materiais vocês já possuem?</Label>
        <div className="flex flex-wrap gap-2">
          {ASSETS_AVAILABLE.map((a) => (
            <Chip
              key={a}
              label={ASSET_LABELS[a]}
              selected={campaign.assetsAvailable.includes(a)}
              onClick={() => toggle(campaign.assetsAvailable, a, "assetsAvailable")}
            />
          ))}
        </div>
      </div>

      <div>
        <Label>O que você quer que a pessoa faça depois de ver a divulgação? (CTA)</Label>
        <Input value={cta} onChange={(e) => setCta(e.target.value)} onBlur={() => patch({ cta })} placeholder="ex: Inscreva-se gratuitamente" />
      </div>

      <div>
        <Label>Link de inscrição/destino (se já existir — senão deixe em branco que criamos uma landing page)</Label>
        <Input value={ctaLink} onChange={(e) => setCtaLink(e.target.value)} onBlur={() => patch({ ctaLink })} placeholder="https://..." />
      </div>
    </div>
  );
}
