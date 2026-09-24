import { z } from "zod";

// Valores fechados usados nos campos `String` do Prisma (SQLite não suporta
// enum nativo). Validar sempre com estes schemas antes de gravar.

export const CAMPAIGN_TYPES = [
  "evento",
  "lancamento",
  "promocao",
  "institucional",
  "geracao_leads",
  "conteudo",
  "sazonal",
] as const;
export const CampaignTypeSchema = z.enum(CAMPAIGN_TYPES);
export type CampaignType = z.infer<typeof CampaignTypeSchema>;

export const CAMPAIGN_STATUSES = [
  "DISCOVERY",
  "PLANNING",
  "ACTIVE",
  "PAUSED",
  "COMPLETED",
  "CANCELLED",
] as const;
export const CampaignStatusSchema = z.enum(CAMPAIGN_STATUSES);
export type CampaignStatus = z.infer<typeof CampaignStatusSchema>;

export const EVENT_FORMATS = ["presencial", "online", "hibrido"] as const;
export const EventFormatSchema = z.enum(EVENT_FORMATS);

export const TASK_STATUSES = [
  "TODO",
  "IN_PROGRESS",
  "WAITING_APPROVAL",
  "BLOCKED",
  "COMPLETED",
  "CANCELLED",
] as const;
export const TaskStatusSchema = z.enum(TASK_STATUSES);

export const TASK_PRIORITIES = ["ALTA", "MEDIA", "BAIXA"] as const;
export const AUTOMATION_LEVELS = ["AUTOMATIC", "ASSISTED", "HUMAN"] as const;
export const AutomationLevelSchema = z.enum(AUTOMATION_LEVELS);

export const RESEARCH_CATEGORIES = ["FACTUAL", "INFERRED", "RECOMMENDATION"] as const;
export const ResearchCategorySchema = z.enum(RESEARCH_CATEGORIES);

export const CONTENT_STATUSES = [
  "DRAFT",
  "PENDING_APPROVAL",
  "APPROVED",
  "SCHEDULED",
  "PUBLISHED",
  "REJECTED",
  "ARCHIVED",
] as const;
export const ContentStatusSchema = z.enum(CONTENT_STATUSES);

export const CREATIVE_STATUSES = [
  "PENDING_GENERATION",
  "GENERATED",
  "FAILED",
  "APPROVED",
  "REJECTED",
] as const;

export const LEAD_STATUSES = [
  "NEW",
  "INTERESTED",
  "REGISTERED",
  "CONFIRMED",
  "ATTENDED",
  "OPPORTUNITY",
  "CUSTOMER",
] as const;
export const LeadStatusSchema = z.enum(LEAD_STATUSES);

export const REGISTRATION_STATUSES = [
  "REGISTERED",
  "CONFIRMED",
  "REMINDER_SENT",
  "CHECKED_IN",
  "NO_SHOW",
  "CANCELLED",
] as const;
export const RegistrationStatusSchema = z.enum(REGISTRATION_STATUSES);

// --- Qualificação do participante (credenciamento de evento) ---

export const PARTICIPANT_SEGMENTS = [
  "PRODUTOR_RURAL",
  "AGRONOMO",
  "GESTOR_FAZENDA",
  "EMPRESARIO",
  "CONSULTOR",
  "FORNECEDOR",
  "CONTADOR",
  "OUTRO",
] as const;
export const ParticipantSegmentSchema = z.enum(PARTICIPANT_SEGMENTS);
export const PARTICIPANT_SEGMENT_LABELS: Record<(typeof PARTICIPANT_SEGMENTS)[number], string> = {
  PRODUTOR_RURAL: "Produtor rural",
  AGRONOMO: "Agrônomo",
  GESTOR_FAZENDA: "Gestor de fazenda",
  EMPRESARIO: "Empresário",
  CONSULTOR: "Consultor",
  FORNECEDOR: "Fornecedor",
  CONTADOR: "Contador",
  OUTRO: "Outro",
};

export const EXISTING_CLIENT_OPTIONS = ["SIM", "NAO", "NAO_SEI"] as const;
export const DIAGNOSTIC_INTEREST_OPTIONS = ["SIM", "QUERO_SABER_MAIS", "NAO"] as const;
export const GIFT_STATUSES = ["PENDING", "PREPARED", "DELIVERED"] as const;

// Versão do texto de consentimento exibido no formulário público — mude este
// valor sempre que o texto mudar, para saber qual versão cada participante
// aceitou (REGRA LGPD do briefing).
export const CONSENT_VERSION = "2026-09-v1";

export const PARTNER_STATUSES = [
  "PROSPECT",
  "CONTACTED",
  "AGREED",
  "MATERIAL_SENT",
  "ACTIVE",
  "COMPLETED",
] as const;

export const APPROVAL_LEVELS = ["AUTOMATIC", "ASSISTED", "HUMAN_APPROVAL"] as const;
export const ApprovalLevelSchema = z.enum(APPROVAL_LEVELS);

export const APPROVAL_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;

export const PRIMARY_OBJECTIVES = [
  "LOTAR_EVENTO",
  "GERAR_LEADS",
  "CONSEGUIR_CLIENTES",
  "FORTALECER_MARCA",
  "EDUCAR_PUBLICO",
  "LANCAR_PRODUTO",
  "RELACIONAMENTO_CLIENTES",
  "OUTRO",
] as const;
export const PrimaryObjectiveSchema = z.enum(PRIMARY_OBJECTIVES);

export const PRIMARY_OBJECTIVE_LABELS: Record<(typeof PRIMARY_OBJECTIVES)[number], string> = {
  LOTAR_EVENTO: "Lotar o evento",
  GERAR_LEADS: "Gerar leads",
  CONSEGUIR_CLIENTES: "Conseguir novos clientes",
  FORTALECER_MARCA: "Fortalecer a marca",
  EDUCAR_PUBLICO: "Educar o público",
  LANCAR_PRODUTO: "Lançar produto/serviço",
  RELACIONAMENTO_CLIENTES: "Relacionamento com clientes",
  OUTRO: "Outro",
};

export const CHANNELS = [
  "instagram",
  "facebook",
  "whatsapp",
  "google",
  "youtube",
  "linkedin",
  "email",
  "radio",
  "parceiros",
  "influenciadores",
  "flyers",
  "cartazes",
  "eventos_presenciais",
  "outros",
] as const;

export const ASSETS_AVAILABLE = [
  "logo",
  "identidade_visual",
  "fotos",
  "videos",
  "fotos_palestrantes",
  "videos_palestrantes",
  "material_institucional",
  "landing_page",
  "lista_contatos",
  "instagram",
  "facebook",
  "whatsapp",
  "outros",
] as const;

export const BUDGET_RANGES = [
  "SEM_ORCAMENTO_PAGO",
  "ATE_300",
  "300_500",
  "500_1000",
  "1000_2000",
  "2000_MAIS",
  "AINDA_NAO_DEFINIDO",
] as const;

// --- Blob livre do briefing (perguntas de descoberta que não viram coluna) ---

export const SpeakerSchema = z.object({
  name: z.string(),
  role: z.string().optional(),
  company: z.string().optional(),
  specialty: z.string().optional(),
  social: z.string().optional(),
  bio: z.string().optional(),
  photoUrl: z.string().optional(),
  // true quando o tema ainda não foi definido — a UI mostra "tema em
  // definição" em vez de inventar um assunto para o palestrante.
  topicPending: z.boolean().optional(),
});
export type Speaker = z.infer<typeof SpeakerSchema>;

export const ScheduleItemSchema = z.object({
  time: z.string(), // "18:30"
  label: z.string(), // "Início da roda de conversa"
});
export type ScheduleItem = z.infer<typeof ScheduleItemSchema>;

export const CampaignHistorySchema = z.object({
  hadSimilar: z.boolean().optional(),
  attendees: z.number().optional(),
  channelsUsed: z.array(z.string()).optional(),
  whatWorked: z.string().optional(),
  whatDidntWork: z.string().optional(),
});

export const PartnerMentionSchema = z.object({
  name: z.string(),
  company: z.string().optional(),
  notes: z.string().optional(),
});

export const ImportantDateSchema = z.object({
  label: z.string(),
  date: z.string(),
});

export const CampaignBriefingExtraSchema = z.object({
  speakers: z.array(SpeakerSchema).default([]),
  topics: z.array(z.string()).default([]),
  history: CampaignHistorySchema.default({}),
  partners: z.array(PartnerMentionSchema).default([]),
  importantDates: z.array(ImportantDateSchema).default([]),
  registrationLink: z.string().optional(),
  motivationProblem: z.string().optional(),
  notes: z.string().optional(),
  // campos que o usuário explicitamente disse "não sei" — não bloqueiam a
  // confirmação, mas continuam listados como pendência leve (RECOMMENDED)
  unknownFields: z.array(z.string()).default([]),

  // --- Landing page de credenciamento de evento ---
  schedule: z.array(ScheduleItemSchema).default([]), // programação do dia
  valuePropositionBullets: z.array(z.string()).default([]), // "por que participar"
  audienceExamples: z.array(z.string()).default([]), // "para quem é"
  networkingHighlight: z.string().optional(), // ex: "20:30 · Churrasco e networking"
  diagnosticDescription: z.string().optional(),
  // true quando o mecanismo exato do diagnóstico ainda não foi confirmado —
  // a landing page avisa isso em vez de inventar como ele funciona.
  diagnosticPending: z.boolean().default(false),
});
export type CampaignBriefingExtra = z.infer<typeof CampaignBriefingExtraSchema>;

export function emptyBriefingExtra(): CampaignBriefingExtra {
  return CampaignBriefingExtraSchema.parse({});
}

export function parseBriefingExtra(raw: string): CampaignBriefingExtra {
  try {
    return CampaignBriefingExtraSchema.parse(JSON.parse(raw));
  } catch {
    return emptyBriefingExtra();
  }
}

export function parseJsonArray<T = string>(raw: string): T[] {
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
