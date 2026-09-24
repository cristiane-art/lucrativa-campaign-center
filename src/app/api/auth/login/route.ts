import { NextResponse } from "next/server";
import { safeJson, jsonError } from "@/lib/api";
import { computeSessionToken, SESSION_COOKIE } from "@/lib/auth";

export async function POST(req: Request) {
  const body = await safeJson<{ password: string }>(req);
  const expected = process.env.DASHBOARD_PASSWORD;

  if (!expected) return NextResponse.json({ ok: true }); // auth desligada

  if (body.password !== expected) {
    return jsonError("Senha incorreta", 401);
  }

  const token = await computeSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 dias
  });
  return res;
}
