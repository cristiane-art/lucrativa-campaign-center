"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardNav } from "./DashboardNav";
import { Card, CardHeader, Badge, Button, Input } from "@/components/ui";
import { PARTICIPANT_SEGMENT_LABELS } from "@/lib/types";

interface Registration {
  id: string;
  status: string;
  checkedInAt: string | null;
}

interface Lead {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  city: string | null;
  company: string | null;
  role: string | null;
  segment: string | null;
  isExistingClient: string | null;
  diagnosticInterest: string | null;
  source: string | null;
  status: string;
  participantCode: string | null;
  createdAt: string;
  registrations: Registration[];
}

function latestRegistrationStatus(lead: Lead): string {
  return lead.registrations[0]?.status ?? "—";
}

function sourceLabel(source: string | null): string {
  if (!source) return "outros";
  if (source === "landing_page") return "direto";
  return source;
}

export function CredentialingBoard({
  campaignId,
  campaignName,
  status,
  eventCapacity,
}: {
  campaignId: string;
  campaignName: string;
  status: string;
  eventCapacity: number | null;
}) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkinQuery, setCheckinQuery] = useState("");
  const [checkinMsg, setCheckinMsg] = useState<{ tone: "ok" | "warn" | "error"; text: string } | null>(null);
  const [filters, setFilters] = useState<{ segment: string; client: string; source: string; regStatus: string }>({
    segment: "",
    client: "",
    source: "",
    regStatus: "",
  });

  async function load() {
    const res = await fetch(`/api/campaigns/${campaignId}/leads`);
    const data = await res.json();
    setLeads(data.leads);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId]);

  const metrics = useMemo(() => {
    const registered = leads.length;
    const confirmed = leads.filter((l) => ["CONFIRMED", "CHECKED_IN"].includes(latestRegistrationStatus(l))).length;
    const checkedIn = leads.filter((l) => latestRegistrationStatus(l) === "CHECKED_IN").length;
    const attendanceRate = registered > 0 ? Math.round((checkedIn / registered) * 100) : 0;
    const newClients = leads.filter((l) => l.status === "CUSTOMER").length;
    const potentialClients = leads.filter((l) => l.isExistingClient === "NAO" || l.isExistingClient === "NAO_SEI").length;
    const diagnosticInterest = leads.filter((l) => l.diagnosticInterest === "SIM" || l.diagnosticInterest === "QUERO_SABER_MAIS").length;

    const sources: Record<string, number> = { instagram: 0, whatsapp: 0, partner: 0, outros: 0 };
    for (const l of leads) {
      const s = sourceLabel(l.source);
      if (s === "instagram") sources.instagram++;
      else if (s === "whatsapp") sources.whatsapp++;
      else if (s === "partner") sources.partner++;
      else sources.outros++;
    }

    return { registered, confirmed, checkedIn, attendanceRate, newClients, potentialClients, diagnosticInterest, sources };
  }, [leads]);

  const filtered = leads.filter((l) => {
    if (filters.segment && l.segment !== filters.segment) return false;
    if (filters.client === "cliente" && l.isExistingClient !== "SIM") return false;
    if (filters.client === "potencial" && !(l.isExistingClient === "NAO" || l.isExistingClient === "NAO_SEI")) return false;
    if (filters.source && sourceLabel(l.source) !== filters.source) return false;
    if (filters.regStatus && latestRegistrationStatus(l) !== filters.regStatus) return false;
    return true;
  });

  async function doCheckin() {
    if (!checkinQuery.trim()) return;
    setCheckinMsg(null);
    const res = await fetch(`/api/campaigns/${campaignId}/checkin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: checkinQuery.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      setCheckinMsg({ tone: "error", text: data.error });
      return;
    }
    setCheckinMsg({
      tone: data.alreadyCheckedIn ? "warn" : "ok",
      text: data.alreadyCheckedIn ? `${data.lead.name} já tinha feito check-in.` : `Check-in confirmado: ${data.lead.name}.`,
    });
    setCheckinQuery("");
    load();
  }

  async function removeLead(lead: Lead) {
    if (!confirm(`Excluir "${lead.name}" e sua inscrição? Essa ação não pode ser desfeita.`)) return;
    const res = await fetch(`/api/leads/${lead.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Não foi possível excluir.");
      return;
    }
    load();
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <DashboardNav campaignId={campaignId} campaignName={campaignName} status={status} />

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        <Metric label="Inscritos" value={eventCapacity ? `${metrics.registered}/${eventCapacity}` : `${metrics.registered}`} />
        <Metric label="Confirmados" value={String(metrics.confirmed)} />
        <Metric label="Check-ins" value={String(metrics.checkedIn)} />
        <Metric label="Comparecimento" value={`${metrics.attendanceRate}%`} />
        <Metric label="Novos clientes" value={String(metrics.newClients)} />
        <Metric label="Potenciais clientes" value={String(metrics.potentialClients)} />
        <Metric label="Interesse em diagnóstico" value={String(metrics.diagnosticInterest)} />
      </div>

      <Card className="mt-4 p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Fontes</p>
        <div className="flex flex-wrap gap-3 text-sm">
          <Badge tone="accent">Instagram: {metrics.sources.instagram}</Badge>
          <Badge tone="accent">WhatsApp: {metrics.sources.whatsapp}</Badge>
          <Badge tone="accent">Parceiros: {metrics.sources.partner}</Badge>
          <Badge tone="muted">Outros: {metrics.sources.outros}</Badge>
        </div>
      </Card>

      <Card className="mt-6">
        <CardHeader title="Credenciamento no dia" subtitle="Busque por código do participante, telefone ou nome" />
        <div className="flex flex-wrap items-center gap-2 p-4">
          <Input
            value={checkinQuery}
            onChange={(e) => setCheckinQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && doCheckin()}
            placeholder="ex: LC-AB3D9F2, telefone ou nome"
            className="max-w-sm"
          />
          <Button onClick={doCheckin}>Fazer check-in</Button>
          {checkinMsg && (
            <span
              className={`text-sm ${checkinMsg.tone === "ok" ? "text-accent-strong" : checkinMsg.tone === "warn" ? "text-amber" : "text-red"}`}
            >
              {checkinMsg.text}
            </span>
          )}
        </div>
      </Card>

      <Card className="mt-6">
        <CardHeader title="Participantes" subtitle={`${filtered.length} de ${leads.length}`} />
        <div className="flex flex-wrap gap-2 border-b border-border px-4 py-3">
          <select className="rounded-lg border border-border bg-surface px-2 py-1 text-xs" value={filters.segment} onChange={(e) => setFilters({ ...filters, segment: e.target.value })}>
            <option value="">Todos os perfis</option>
            {Object.entries(PARTICIPANT_SEGMENT_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select className="rounded-lg border border-border bg-surface px-2 py-1 text-xs" value={filters.client} onChange={(e) => setFilters({ ...filters, client: e.target.value })}>
            <option value="">Cliente? (todos)</option>
            <option value="cliente">Já é cliente</option>
            <option value="potencial">Potencial cliente</option>
          </select>
          <select className="rounded-lg border border-border bg-surface px-2 py-1 text-xs" value={filters.source} onChange={(e) => setFilters({ ...filters, source: e.target.value })}>
            <option value="">Todas as origens</option>
            <option value="instagram">Instagram</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="partner">Parceiros</option>
            <option value="outros">Outros</option>
          </select>
          <select className="rounded-lg border border-border bg-surface px-2 py-1 text-xs" value={filters.regStatus} onChange={(e) => setFilters({ ...filters, regStatus: e.target.value })}>
            <option value="">Todos os status</option>
            <option value="REGISTERED">Inscrito</option>
            <option value="CONFIRMED">Confirmado</option>
            <option value="CHECKED_IN">Check-in feito</option>
            <option value="NO_SHOW">Não compareceu</option>
            <option value="CANCELLED">Cancelado</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase text-muted">
                <th className="px-4 py-2">Nome</th>
                <th className="px-4 py-2">Empresa</th>
                <th className="px-4 py-2">Cargo</th>
                <th className="px-4 py-2">Cidade</th>
                <th className="px-4 py-2">Perfil</th>
                <th className="px-4 py-2">Cliente?</th>
                <th className="px-4 py-2">Origem</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Diagnóstico</th>
                <th className="px-4 py-2">Inscrito em</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-4 py-6 text-center text-muted">
                    Nenhum participante com esse filtro.
                  </td>
                </tr>
              )}
              {filtered.map((l) => (
                <tr key={l.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-2 font-medium text-ink">{l.name}</td>
                  <td className="px-4 py-2 text-muted">{l.company || "—"}</td>
                  <td className="px-4 py-2 text-muted">{l.role || "—"}</td>
                  <td className="px-4 py-2 text-muted">{l.city || "—"}</td>
                  <td className="px-4 py-2 text-muted">
                    {l.segment ? PARTICIPANT_SEGMENT_LABELS[l.segment as keyof typeof PARTICIPANT_SEGMENT_LABELS] ?? l.segment : "—"}
                  </td>
                  <td className="px-4 py-2 text-muted">{l.isExistingClient ?? "—"}</td>
                  <td className="px-4 py-2 text-muted">{sourceLabel(l.source)}</td>
                  <td className="px-4 py-2">
                    <Badge tone={latestRegistrationStatus(l) === "CHECKED_IN" ? "accent" : "muted"}>
                      {latestRegistrationStatus(l)}
                    </Badge>
                  </td>
                  <td className="px-4 py-2 text-muted">{l.diagnosticInterest ?? "—"}</td>
                  <td className="px-4 py-2 text-muted">{new Date(l.createdAt).toLocaleDateString("pt-BR")}</td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => removeLead(l)}
                      className="text-xs font-medium text-red hover:underline"
                      title="Excluir participante"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-3">
      <p className="text-[11px] uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 font-display text-lg font-semibold text-accent-strong">{value}</p>
    </Card>
  );
}
