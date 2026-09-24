import { NextResponse } from "next/server";
import { safeJson, jsonError } from "@/lib/api";
import { decideApproval } from "@/lib/approvals";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await safeJson<{ decision: "APPROVED" | "REJECTED" }>(req);
  if (body.decision !== "APPROVED" && body.decision !== "REJECTED") {
    return jsonError("decision precisa ser APPROVED ou REJECTED");
  }
  const approval = await decideApproval(id, body.decision, "usuario");
  return NextResponse.json({ approval });
}
