"use client";

import { useState } from "react";
import { Label, Input, Chip } from "@/components/ui";
import type { StepProps } from "./types";

const TYPES = [
  { value: "evento", label: "Evento" },
  { value: "lancamento", label: "Lançamento" },
  { value: "promocao", label: "Promoção" },
  { value: "institucional", label: "Institucional" },
  { value: "geracao_leads", label: "Geração de leads" },
  { value: "conteudo", label: "Campanha de conteúdo" },
  { value: "sazonal", label: "Sazonal" },
];

const FORMATS = [
  { value: "presencial", label: "Presencial" },
  { value: "online", label: "Online" },
  { value: "hibrido", label: "Híbrido" },
];

export function StepEvento({ campaign, patch }: StepProps) {
  const [name, setName] = useState(campaign.name);
  const [location, setLocation] = useState(campaign.eventLocation ?? "");
  const [time, setTime] = useState(campaign.eventTime ?? "");
  const [capacity, setCapacity] = useState(campaign.eventCapacity?.toString() ?? "");
  const [capacityUnknown, setCapacityUnknown] = useState(campaign.briefingExtra.unknownFields?.includes("eventCapacity") ?? false);
  const [price, setPrice] = useState(campaign.eventPrice?.toString() ?? "");

  return (
    <div className="space-y-5">
      <div>
        <Label>Qual é o nome do evento/campanha?</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} onBlur={() => patch({ name })} />
      </div>

      <div>
        <Label>Tipo de campanha</Label>
        <div className="flex flex-wrap gap-2">
          {TYPES.map((t) => (
            <Chip key={t.value} label={t.label} selected={campaign.campaignType === t.value} onClick={() => patch({ campaignType: t.value })} />
          ))}
        </div>
      </div>

      {campaign.campaignType === "evento" && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Data do evento</Label>
              <Input
                type="date"
                value={campaign.eventDate ? campaign.eventDate.slice(0, 10) : ""}
                onChange={(e) => patch({ eventDate: e.target.value ? new Date(e.target.value).toISOString() : null })}
              />
            </div>
            <div>
              <Label>Horário</Label>
              <Input value={time} onChange={(e) => setTime(e.target.value)} onBlur={() => patch({ eventTime: time })} placeholder="ex: 19h" />
            </div>
          </div>

          <div>
            <Label>Formato</Label>
            <div className="flex gap-2">
              {FORMATS.map((f) => (
                <Chip key={f.value} label={f.label} selected={campaign.eventFormat === f.value} onClick={() => patch({ eventFormat: f.value })} />
              ))}
            </div>
          </div>

          {campaign.eventFormat !== "online" && (
            <div>
              <Label>Onde será realizado?</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} onBlur={() => patch({ eventLocation: location })} />
            </div>
          )}

          <div>
            <Label>Existe limite de participantes?</Label>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                value={capacity}
                disabled={capacityUnknown}
                onChange={(e) => setCapacity(e.target.value)}
                onBlur={() => capacity && patch({ eventCapacity: Number(capacity) })}
                className="w-40"
                placeholder="capacidade"
              />
              <label className="flex items-center gap-1.5 text-sm text-muted">
                <input
                  type="checkbox"
                  checked={capacityUnknown}
                  onChange={async (e) => {
                    setCapacityUnknown(e.target.checked);
                    await patch({
                      eventCapacity: e.target.checked ? null : capacity ? Number(capacity) : null,
                      briefingExtra: {
                        unknownFields: e.target.checked
                          ? [...(campaign.briefingExtra.unknownFields ?? []), "eventCapacity"]
                          : (campaign.briefingExtra.unknownFields ?? []).filter((f) => f !== "eventCapacity"),
                      },
                    });
                  }}
                />
                não sei ainda
              </label>
            </div>
          </div>

          <div>
            <Label>O evento é gratuito ou pago?</Label>
            <div className="flex items-center gap-3">
              <Chip label="Gratuito" selected={campaign.eventIsPaid === false} onClick={() => patch({ eventIsPaid: false, eventPrice: null })} />
              <Chip label="Pago" selected={campaign.eventIsPaid === true} onClick={() => patch({ eventIsPaid: true })} />
              {campaign.eventIsPaid && (
                <Input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  onBlur={() => price && patch({ eventPrice: Number(price) })}
                  placeholder="valor (R$)"
                  className="w-32"
                />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
