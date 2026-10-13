import { db } from "@/lib/db";
import { PARTICIPANT_SEGMENT_LABELS } from "@/lib/types";

// Planilha de credenciamento (CSV) — pensada pra imprimir ou abrir no Excel
// na entrada do evento. Ponto e vírgula como separador e BOM UTF-8 no início
// porque é o que o Excel em PT-BR espera por padrão; sem isso ele quebra
// acentos e joga tudo numa coluna só.
const CLIENT_LABELS: Record<string, string> = {
  SIM: "Sim",
  NAO: "Não",
  NAO_SEI: "Não sei",
};

const DIAGNOSTIC_LABELS: Record<string, string> = {
  SIM: "Quer diagnóstico",
  QUERO_SABER_MAIS: "Quer saber mais",
  NAO: "Não",
};

function sourceLabel(source: string | null): string {
  if (!source) return "Outros";
  if (source === "landing_page") return "Direto";
  if (source === "instagram") return "Instagram";
  if (source === "whatsapp") return "WhatsApp";
  if (source === "partner") return "Parceiros";
  return source;
}

function csvCell(value: string | null | undefined): string {
  const text = (value ?? "").replace(/"/g, '""');
  return `"${text}"`;
}

function formatDate(date: Date | null): string {
  if (!date) return "";
  return date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = await db.campaign.findUnique({ where: { id } });
  const leads = await db.lead.findMany({
    where: { campaignId: id },
    orderBy: { name: "asc" },
    include: { registrations: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  const header = [
    "Nome",
    "Telefone",
    "Email",
    "Empresa",
    "Cargo",
    "Cidade",
    "Perfil",
    "Já é cliente",
    "Origem",
    "Status da inscrição",
    "Código do participante",
    "Interesse em diagnóstico",
    "Check-in em",
    "Inscrito em",
  ];

  const rows = leads.map((lead) => {
    const registration = lead.registrations[0];
    return [
      lead.name,
      lead.phone,
      lead.email,
      lead.company,
      lead.role,
      lead.city,
      lead.segment ? PARTICIPANT_SEGMENT_LABELS[lead.segment as keyof typeof PARTICIPANT_SEGMENT_LABELS] ?? lead.segment : "",
      lead.isExistingClient ? CLIENT_LABELS[lead.isExistingClient] ?? lead.isExistingClient : "",
      sourceLabel(lead.source),
      registration?.status ?? "",
      lead.participantCode,
      lead.diagnosticInterest ? DIAGNOSTIC_LABELS[lead.diagnosticInterest] ?? lead.diagnosticInterest : "",
      formatDate(registration?.checkedInAt ?? null),
      formatDate(lead.createdAt),
    ].map(csvCell);
  });

  const csv = [header.map(csvCell), ...rows].map((row) => row.join(";")).join("\r\n");
  const bom = "﻿";

  const fileName = `credenciamento-${(campaign?.name || "evento").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.csv`;

  return new Response(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
