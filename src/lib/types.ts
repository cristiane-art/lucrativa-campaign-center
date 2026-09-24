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
  "ATTENDED",
  "NO_SHOW",
  "CANCELLED",
] as const;

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
});
export type Speaker = z.infer<typeof SpeakerSchema>;

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
