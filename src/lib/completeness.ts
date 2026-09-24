import type { Campaign } from "@prisma/client";
import { parseBriefingExtra, parseJsonArray } from "./types";

// CampaignCompletenessChecker — seção 17 do addendum "Modo de Descoberta".
// Nunca assume valor ausente; sempre relata o que falta e nunca deixa a
// campanha sair de DISCOVERY enquanto houver pendência obrigatória.

export interface CompletenessResult {
  complete: boolean;
  missing: string[]; // bloqueiam a confirmação
  recommended: string[]; // não bloqueiam, mas devem ser perguntados/lembrados
}

const FIELD_LABELS: Record<string, string> = {
  name: "nome do evento/campanha",
  primaryObjective: "objetivo principal",
  audience: "público-alvo",
  channels: "canais disponíveis",
  cta: "chamada para ação (CTA)",
  eventDate: "data do evento",
  eventFormat: "formato (presencial/online/híbrido)",
  eventLocation: "local do evento",
  eventPrice: "valor do ingresso (evento pago)",
  targetResult: "meta da campanha",
  budget: "orçamento de divulgação",
  eventCapacity: "capacidade do evento",
  region: "região/cidade prioritária",
};

export function fieldLabel(key: string): string {
  return FIELD_LABELS[key] ?? key;
}

export function checkCampaignCompleteness(campaign: Campaign): CompletenessResult {
  const extra = parseBriefingExtra(campaign.briefingExtra);
  const channels = parseJsonArray<string>(campaign.channels);
  const unknown = new Set(extra.unknownFields);

  const missing: string[] = [];
  const recommended: string[] = [];

  const requireOrMissing = (key: string, present: boolean) => {
    if (present) return;
    if (unknown.has(key)) recommended.push(key);
    else missing.push(key);
  };

  requireOrMissing("name", !!campaign.name?.trim());
  requireOrMissing("primaryObjective", !!campaign.primaryObjective);
  requireOrMissing("audience", !!campaign.audience?.trim());
  requireOrMissing("channels", channels.length > 0);
  requireOrMissing("cta", !!campaign.cta?.trim());

  if (campaign.campaignType === "evento") {
    requireOrMissing("eventDate", !!campaign.eventDate);
    requireOrMissing("eventFormat", !!campaign.eventFormat);
    if (campaign.eventFormat !== "online") {
      requireOrMissing("eventLocation", !!campaign.eventLocation?.trim());
    }
    if (campaign.eventIsPaid) {
      requireOrMissing("eventPrice", campaign.eventPrice != null);
    }
    // capacidade é "sim/não/não sei" — só é pendência obrigatória se nunca
    // respondida (undefined), não quando explicitamente marcada "não sei"
    requireOrMissing("eventCapacity", campaign.eventCapacity != null);
  }

  // Meta e orçamento nunca são inventados: se o usuário disse "ainda não
  // sei", isso é uma resposta válida (recommended), não bloqueia a campanha.
  const hasBudgetSignal =
    campaign.adBudget != null || !!campaign.budgetRangeLabel;
  requireOrMissing("budget", hasBudgetSignal);
  requireOrMissing("targetResult", campaign.targetResult != null);
  requireOrMissing("region", !!campaign.region?.trim());

  return {
    complete: missing.length === 0,
    missing,
    recommended,
  };
}
