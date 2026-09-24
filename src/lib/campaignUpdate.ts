import { z } from "zod";
import { db } from "./db";
import { CampaignBriefingExtraSchema, CampaignTypeSchema, EventFormatSchema, PrimaryObjectiveSchema } from "./types";
import { checkCampaignCompleteness } from "./completeness";

// Payload aceito pelo PATCH /api/campaigns/[id] — cada campo é opcional
// porque o wizard salva o briefing em etapas (nunca assume valor ausente).
export const CampaignUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  campaignType: CampaignTypeSchema.optional(),
  primaryObjective: PrimaryObjectiveSchema.optional(),
  secondaryObjectives: z.array(z.string()).optional(),

  startDate: z.string().datetime().optional().or(z.literal(null)),
  endDate: z.string().datetime().optional().or(z.literal(null)),

  eventDate: z.string().datetime().optional().or(z.literal(null)),
  eventTime: z.string().optional(),
  eventLocation: z.string().optional(),
  eventFormat: EventFormatSchema.optional(),
  eventCapacity: z.number().int().positive().optional().or(z.literal(null)),
  eventIsPaid: z.boolean().optional(),
  eventPrice: z.number().nonnegative().optional().or(z.literal(null)),

  audience: z.string().optional(),
  audienceSegments: z.array(z.string()).optional(),
  region: z.string().optional(),

  targetResult: z.number().int().positive().optional().or(z.literal(null)),
  targetMetricLabel: z.string().optional(),

  adBudget: z.number().nonnegative().optional().or(z.literal(null)),
  creativeBudget: z.number().nonnegative().optional().or(z.literal(null)),
  physicalBudget: z.number().nonnegative().optional().or(z.literal(null)),
  partnerBudget: z.number().nonnegative().optional().or(z.literal(null)),
  otherBudget: z.number().nonnegative().optional().or(z.literal(null)),
  budgetRangeLabel: z.string().optional(),

  valueProposition: z.string().optional(),
  cta: z.string().optional(),
  ctaLink: z.string().optional(),

  channels: z.array(z.string()).optional(),
  assetsAvailable: z.array(z.string()).optional(),
  constraints: z.array(z.string()).optional(),

  briefingExtra: CampaignBriefingExtraSchema.partial().optional(),
});
export type CampaignUpdateInput = z.infer<typeof CampaignUpdateSchema>;

export async function updateCampaignFromWizard(campaignId: string, patch: CampaignUpdateInput) {
  const current = await db.campaign.findUniqueOrThrow({ where: { id: campaignId } });

  const data: Record<string, unknown> = {};
  const scalarKeys: (keyof CampaignUpdateInput)[] = [
    "name",
    "description",
    "campaignType",
    "primaryObjective",
    "eventTime",
    "eventLocation",
    "eventFormat",
    "eventIsPaid",
    "eventPrice",
    "eventCapacity",
    "audience",
    "region",
    "targetResult",
    "targetMetricLabel",
    "adBudget",
    "creativeBudget",
    "physicalBudget",
    "partnerBudget",
    "otherBudget",
    "budgetRangeLabel",
    "valueProposition",
    "cta",
    "ctaLink",
  ];
  for (const key of scalarKeys) {
    if (patch[key] !== undefined) data[key] = patch[key];
  }

  for (const dateKey of ["startDate", "endDate", "eventDate"] as const) {
    if (patch[dateKey] !== undefined) {
      data[dateKey] = patch[dateKey] ? new Date(patch[dateKey] as string) : null;
    }
  }

  if (patch.secondaryObjectives) data.secondaryObjectives = JSON.stringify(patch.secondaryObjectives);
  if (patch.audienceSegments) data.audienceSegments = JSON.stringify(patch.audienceSegments);
  if (patch.channels) data.channels = JSON.stringify(patch.channels);
  if (patch.assetsAvailable) data.assetsAvailable = JSON.stringify(patch.assetsAvailable);
  if (patch.constraints) data.constraints = JSON.stringify(patch.constraints);

  if (patch.briefingExtra) {
    const currentExtra = JSON.parse(current.briefingExtra || "{}");
    const merged = { ...currentExtra, ...patch.briefingExtra };
    data.briefingExtra = JSON.stringify(merged);
  }

  const updated = await db.campaign.update({ where: { id: campaignId }, data });

  const completeness = checkCampaignCompleteness(updated);
  return db.campaign.update({
    where: { id: campaignId },
    data: {
      briefingComplete: completeness.complete,
      briefingMissing: JSON.stringify(completeness.missing),
    },
  });
}
