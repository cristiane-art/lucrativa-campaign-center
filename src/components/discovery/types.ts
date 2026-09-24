import type { SerializedCampaign } from "@/lib/serialize";

export interface StepProps {
  campaign: SerializedCampaign;
  patch: (partial: Record<string, unknown>) => Promise<SerializedCampaign>;
}

export function toggleUnknownField(campaign: SerializedCampaign, field: string, mark: boolean) {
  const current = new Set(campaign.briefingExtra.unknownFields ?? []);
  if (mark) current.add(field);
  else current.delete(field);
  return { briefingExtra: { unknownFields: Array.from(current) } };
}
