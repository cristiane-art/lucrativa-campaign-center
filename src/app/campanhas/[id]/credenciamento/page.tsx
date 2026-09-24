import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { CredentialingBoard } from "@/components/dashboard/CredentialingBoard";

export const dynamic = "force-dynamic";

export default async function CredenciamentoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = await db.campaign.findUnique({ where: { id } });
  if (!campaign) notFound();
  return (
    <CredentialingBoard
      campaignId={campaign.id}
      campaignName={campaign.name}
      status={campaign.status}
      eventCapacity={campaign.eventCapacity}
    />
  );
}
