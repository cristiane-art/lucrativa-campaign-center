import { NextResponse, type NextRequest } from "next/server";
import { computeSessionToken, SESSION_COOKIE } from "@/lib/auth";

// Protege o dashboard (dado pessoal de participantes) e as APIs internas.
// Nunca protege /inscricao, /r ou /api/registration — essas são públicas de
// propósito (landing page e link curto do evento).
export async function middleware(req: NextRequest) {
  const token = await computeSessionToken();
  if (!token) return NextResponse.next(); // DASHBOARD_PASSWORD não configurada — auth desligada

  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  if (cookie === token) return NextResponse.next();

  if (req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("next", req.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/campanhas/:path*",
    "/api/campaigns/:path*",
    "/api/content/:path*",
    "/api/leads/:path*",
    "/api/tasks/:path*",
    "/api/approvals/:path*",
  ],
};
