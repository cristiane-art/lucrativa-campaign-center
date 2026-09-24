import { db } from "./db";

// REGRA 6/8/31: todo agente registra execução; toda ação automática é auditável.
export async function logActivity(
  campaignId: string,
  agent: string,
  action: string,
  details: Record<string, unknown> = {}
) {
  return db.activityLog.create({
    data: {
      campaignId,
      agent,
      action,
      detailsJson: JSON.stringify(details),
    },
  });
}
