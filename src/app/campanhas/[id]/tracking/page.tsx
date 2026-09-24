import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { TrackingBoard } from "@/components/dashboard/TrackingBoard";

export const dynamic = "force-dynamic";

export default async function TrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = await db.campaign.findUnique({ where: { id } });
  if (!campaign) notFound();
  return <TrackingBoard campaignId={campaign.id} campaignName={campaign.name} status={campaign.status} />;
}
