// Autenticação simples do dashboard — uma senha compartilhada, não um
// sistema de usuários. Certo tamanho para este MVP: agora que o dashboard
// mostra dado pessoal real de participantes, deixar de propósito sem
// nenhuma proteção deixou de ser aceitável, mas construir login
// multi-usuário aqui seria over-engineering. Ver docs/deployment.md.
export const SESSION_COOKIE = "lucrativa_dashboard_session";

const encoder = new TextEncoder();

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Token determinístico derivado da senha — nunca guarda a senha em texto
// puro no cookie. Retorna null quando DASHBOARD_PASSWORD não está
// configurada (auth fica desligada, útil em desenvolvimento local).
export async function computeSessionToken(): Promise<string | null> {
  const password = process.env.DASHBOARD_PASSWORD;
  if (!password) return null;
  const data = encoder.encode(`lucrativa-dashboard-session:${password}`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return toHex(hash);
}

export function isAuthConfigured(): boolean {
  return !!process.env.DASHBOARD_PASSWORD;
}
