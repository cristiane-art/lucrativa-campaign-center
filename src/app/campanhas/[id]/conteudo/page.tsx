import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ContentBoard } from "@/components/dashboard/ContentBoard";

export const dynamic = "force-dynamic";

export default async function ContentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = await db.campaign.findUnique({ where: { id } });
  if (!campaign) notFound();
  return <ContentBoard campaignId={campaign.id} campaignName={campaign.name} status={campaign.status} />;
}
