import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getOrCreateDefaultClient } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export default async function NewCampaignPage() {
  const client = await getOrCreateDefaultClient();
  const campaign = await db.campaign.create({
    data: { clientId: client.id, name: "Nova campanha", campaignType: "evento", status: "DISCOVERY" },
  });
  redirect(`/campanhas/${campaign.id}`);
}
