import type { Campaign } from "@prisma/client";
import { parseBriefingExtra, parseJsonArray, type CampaignBriefingExtra } from "./types";

// Formato "plano" (sem Date, sem JSON-string) que os componentes cliente
// consomem — evita cada componente ter que reimplementar o parse dos campos
// JSON do Prisma.
export interface SerializedCampaign {
  id: string;
  clientId: string;
  name: string;
  description: string | null;
  campaignType: string;
  status: string;
  primaryObjective: string | null;
  secondaryObjectives: string[];
  startDate: string | null;
  endDate: string | null;
  eventDate: string | null;
  eventTime: string | null;
  eventLocation: string | null;
  eventFormat: string | null;
  eventCapacity: number | null;
  eventIsPaid: boolean | null;
  eventPrice: number | null;
  audience: string | null;
  audienceSegments: string[];
  region: string | null;
  targetResult: number | null;
  targetMetricLabel: string | null;
  adBudget: number | null;
  creativeBudget: number | null;
  physicalBudget: number | null;
  partnerBudget: number | null;
  otherBudget: number | null;
  budgetRangeLabel: string | null;
  valueProposition: string | null;
  cta: string | null;
  ctaLink: string | null;
  landingSubtitle: string | null;
  bannerImageUrl: string | null;
  channels: string[];
  assetsAvailable: string[];
  constraints: string[];
  briefingExtra: CampaignBriefingExtra;
  briefingComplete: boolean;
  briefingMissing: string[];
  createdAt: string;
  updatedAt: string;
}

export function serializeCampaign(c: Campaign): SerializedCampaign {
  return {
    id: c.id,
    clientId: c.clientId,
    name: c.name,
    description: c.description,
    campaignType: c.campaignType,
    status: c.status,
    primaryObjective: c.primaryObjective,
    secondaryObjectives: parseJsonArray<string>(c.secondaryObjectives),
    startDate: c.startDate?.toISOString() ?? null,
    endDate: c.endDate?.toISOString() ?? null,
    eventDate: c.eventDate?.toISOString() ?? null,
    eventTime: c.eventTime,
    eventLocation: c.eventLocation,
    eventFormat: c.eventFormat,
    eventCapacity: c.eventCapacity,
    eventIsPaid: c.eventIsPaid,
    eventPrice: c.eventPrice,
    audience: c.audience,
    audienceSegments: parseJsonArray<string>(c.audienceSegments),
    region: c.region,
    targetResult: c.targetResult,
    targetMetricLabel: c.targetMetricLabel,
    adBudget: c.adBudget,
    creativeBudget: c.creativeBudget,
    physicalBudget: c.physicalBudget,
    partnerBudget: c.partnerBudget,
    otherBudget: c.otherBudget,
    budgetRangeLabel: c.budgetRangeLabel,
    valueProposition: c.valueProposition,
    cta: c.cta,
    ctaLink: c.ctaLink,
    landingSubtitle: c.landingSubtitle,
    bannerImageUrl: c.bannerImageUrl,
    channels: parseJsonArray<string>(c.channels),
    assetsAvailable: parseJsonArray<string>(c.assetsAvailable),
    constraints: parseJsonArray<string>(c.constraints),
    briefingExtra: parseBriefingExtra(c.briefingExtra),
    briefingComplete: c.briefingComplete,
    briefingMissing: parseJsonArray<string>(c.briefingMissing),
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}
