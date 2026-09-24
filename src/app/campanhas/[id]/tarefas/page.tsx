import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { TasksBoard } from "@/components/dashboard/TasksBoard";

export const dynamic = "force-dynamic";

export default async function TasksPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = await db.campaign.findUnique({ where: { id } });
  if (!campaign) notFound();
  return <TasksBoard campaignId={campaign.id} campaignName={campaign.name} status={campaign.status} />;
}
