import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { CampaignDiscovery } from "@/components/discovery/CampaignDiscovery";
import { CampaignDashboard } from "@/components/dashboard/CampaignDashboard";
import { checkCampaignCompleteness } from "@/lib/completeness";
import { serializeCampaign } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export default async function CampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = await db.campaign.findUnique({ where: { id } });
  if (!campaign) notFound();

  const completeness = checkCampaignCompleteness(campaign);
  const serialized = serializeCampaign(campaign);

  if (campaign.status === "DISCOVERY") {
    return <CampaignDiscovery campaign={serialized} completeness={completeness} />;
  }

  return <CampaignDashboard campaign={serialized} />;
}
