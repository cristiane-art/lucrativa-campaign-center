import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { LeadsBoard } from "@/components/dashboard/LeadsBoard";

export const dynamic = "force-dynamic";

export default async function LeadsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = await db.campaign.findUnique({ where: { id } });
  if (!campaign) notFound();
  return <LeadsBoard campaignId={campaign.id} campaignName={campaign.name} status={campaign.status} />;
}
