import { db } from "./db";
import { BRAND } from "./brand";

// MVP: um único tenant (Lucrattiva) resolvido no servidor. A arquitetura já é
// multi-tenant (todo dado é filtrado por clientId) — falta apenas a tela de
// login/seleção de conta para virar SaaS multi-cliente (ver docs/architecture.md,
// seção "Roadmap"). Nunca remover o filtro por clientId ao evoluir isso.
export async function getOrCreateDefaultClient() {
  const slug = process.env.SEED_CLIENT_SLUG || "lucrattiva";
  // upsert em vez de find-then-create: evita corrida entre requisições
  // concorrentes (ex.: build estático tentando renderizar várias páginas em
  // paralelo) tentando criar o mesmo tenant ao mesmo tempo.
  return db.client.upsert({
    where: { slug },
    update: {},
    create: {
      slug,
      name: process.env.SEED_CLIENT_NAME || BRAND.fullName,
      brandName: BRAND.name,
      brandPrimaryColor: BRAND.colors.accent,
      brandAccentColor: BRAND.colors.amber,
    },
  });
}
