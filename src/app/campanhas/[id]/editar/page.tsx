import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { serializeCampaign } from "@/lib/serialize";
import { EditBriefing } from "@/components/discovery/EditBriefing";

export const dynamic = "force-dynamic";

export default async function EditCampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = await db.campaign.findUnique({ where: { id } });
  if (!campaign) notFound();
  return <EditBriefing campaign={serializeCampaign(campaign)} />;
}
