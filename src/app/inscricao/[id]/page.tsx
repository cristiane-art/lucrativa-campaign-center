import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { RegistrationForm } from "@/components/RegistrationForm";
import { EventBanner } from "@/components/EventBanner";
import { SectionDivider } from "@/components/SectionDivider";
import { BRAND } from "@/lib/brand";
import { parseBriefingExtra } from "@/lib/types";
import {
  IconCalendar,
  IconChat,
  IconCheck,
  IconClock,
  IconFood,
  IconLeaf,
  IconMic,
  IconPin,
  IconSparkle,
  IconUsers,
} from "@/components/icons";
const fotosPalestrantes: Record<string, string> = {
  "Cristiane Dartora": "/Palestrantes/Cristiane%20Dartora.jpg",
  "Cristiane Lantin": "/Palestrantes/Cristiane%20Lantin.jpg",
  "Aline Ramos": "/Palestrantes/Aline%20Ramos.jpg",
};

const apresentacoesPalestrantes: Record<
  string,
  { biografia: string; temas: string[] }
> = {
  "Cristiane Dartora": {
    biografia:
      "Cristiane Dartora é contadora, especialista em Agrotributário e pós-graduada em Contabilidade, Auditoria e Perícia do Agronegócio. Possui mais de 12 anos de experiência na área contábil e, há 5 anos, é CEO e fundadora da Lucrattiva Contabilidade Agribusiness, com atuação estratégica em soluções contábeis e tributárias voltadas ao agronegócio.",
    temas: [
      "A Reforma Tributária no Agro",
      "Cadastros Comerciais",
    ],
  },
  "Cristiane Lantin": {
    biografia: "Formada em Direito e em Contabilidade, Pós-graduada em direito Tributário pela USP, MBA em Auditoria pela Trevisan, Especialista em Tributos do Agronegócio, Mais de 25 anos de atuação em contibilidade, Foi membro da Comissão de Direito Agrário da OAB/SP",
    temas: [
      "A Nota Fiscal",
      "O que não muda",
    ],
  },
  "Aline Ramos": {
    biografia:
      "Aline Ramos é contadora, pós-graduada em Planejamento Tributário e Diretora Operacional da Lucrattiva Contabilidade Agribusiness. Possui 18 anos de experiência na área contábil, com forte atuação no agronegócio, especialmente em revendas agrícolas, gestão tributária e empresarial.",
    temas: [
      "Quem é contribuinte do IBS/CBS",
      "Gestão Fiscal e Financeira",
    ],
  },
};

function scheduleIcon(label: string) {
  const l = label.toLowerCase();
  if (l.includes("churrasco") || l.includes("jantar") || l.includes("almoço")) return IconFood;
  if (l.includes("pergunta")) return IconChat;
  if (l.includes("networking")) return IconUsers;
  if (l.includes("início") || l.includes("inicio") || l.includes("abertura")) return IconMic;
  return IconUsers;
}

export const dynamic = "force-dynamic";

function formatEventDate(date: Date | null) {
  if (!date) return null;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const campaign = await db.campaign.findUnique({ where: { id } });
  if (!campaign) return {};

  const title = campaign.name;
  const description =
    campaign.landingSubtitle || campaign.valueProposition || `Inscreva-se: ${campaign.name} — ${BRAND.fullName}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      locale: "pt_BR",
      ...(campaign.bannerImageUrl ? { images: [{ url: campaign.bannerImageUrl }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function InscricaoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = await db.campaign.findUnique({ where: { id } });
  if (!campaign) notFound();

  const extra = parseBriefingExtra(campaign.briefingExtra);
  const dateLabel = formatEventDate(campaign.eventDate);
  const displayCapacity = extra.landingCapacityLabel ?? campaign.eventCapacity;

  // Vagas restantes reais, mas só divulgadas em relação ao número público
  // (displayCapacity) — nunca "esgotado" aqui, já que a capacidade real
  // (campaign.eventCapacity) pode ser maior de propósito (ver landingCapacityLabel).
  const registeredCount = await db.registration.count({
    where: { campaignId: campaign.id, status: { not: "CANCELLED" } },
  });
  const remainingSeats =
    displayCapacity != null && registeredCount > 0 && registeredCount < displayCapacity
      ? displayCapacity - registeredCount
      : null;

  return (
    <main className="min-h-screen bg-bg">
      {/* HERO */}
      <section className="relative flex min-h-[92vh] items-center justify-center overflow-hidden text-center">
        <div className="absolute inset-0">
          {campaign.bannerImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={campaign.bannerImageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <EventBanner className="h-full w-full" />
          )}
          {campaign.bannerImageUrl && (
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/85" />
          )}
        </div>

        <div className="relative z-10 mx-auto max-w-3xl px-5 py-24">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber">
            {BRAND.fullName} · Agribusiness
          </p>
          <h1 className="mt-4 font-display text-4xl font-semibold leading-tight text-white sm:text-6xl">
            {campaign.name}
          </h1>
          {campaign.landingSubtitle && (
            <p className="mx-auto mt-5 max-w-xl text-base text-white/85 sm:text-lg">{campaign.landingSubtitle}</p>
          )}

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm text-white">
            {dateLabel && (
              <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 backdrop-blur-sm">
                <IconCalendar className="h-4 w-4 text-amber" />
                {dateLabel}
              </span>
            )}
            {campaign.eventTime && (
              <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 backdrop-blur-sm">
                <IconClock className="h-4 w-4 text-amber" />
                {campaign.eventTime}
              </span>
            )}
            {campaign.eventLocation && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(campaign.eventLocation)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 backdrop-blur-sm transition-colors hover:bg-white/20"
              >
                <IconPin className="h-4 w-4 text-amber" />
                {campaign.eventLocation}
              </a>
            )}
          </div>

          <a
            href="#inscricao"
            className="mt-10 inline-flex items-center justify-center rounded-lg bg-amber px-8 py-3.5 text-sm font-semibold uppercase tracking-wide text-[#12301c] shadow-lg transition-transform hover:scale-[1.02]"
          >
            {campaign.cta || "Quero participar"}
          </a>

          {displayCapacity && (
            <p className="mt-4 text-xs uppercase tracking-wide text-white/60">
              {remainingSeats != null
                ? `Restam ${remainingSeats} vagas · encontro para até ${displayCapacity} pessoas`
                : `Vagas limitadas · encontro para até ${displayCapacity} pessoas`}
            </p>
          )}
        </div>
      </section>
      <SectionDivider fromColor="var(--accent-strong)" toColor="var(--bg)" />

      {/* POR QUE PARTICIPAR */}
      {extra.valuePropositionBullets.length > 0 && (
        <section className="mx-auto max-w-4xl px-5 py-16 sm:py-20">
          <h2 className="text-center font-display text-2xl font-semibold text-accent-strong sm:text-3xl">
            Por que participar
          </h2>
          {campaign.valueProposition && (
            <p className="mx-auto mt-3 max-w-xl text-center text-sm text-muted">{campaign.valueProposition}</p>
          )}
          <ul className="mx-auto mt-10 grid max-w-2xl gap-4 sm:grid-cols-2">
            {extra.valuePropositionBullets.map((bullet) => (
              <li
                key={bullet}
                className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-strong">
                  <IconCheck className="h-3.5 w-3.5" />
                </span>
                <span className="text-sm text-ink">{bullet}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* PARA QUEM É */}
      {extra.audienceExamples.length > 0 && (
        <section className="bg-surface-2 py-16 sm:py-20">
          <div className="mx-auto max-w-3xl px-5 text-center">
            <h2 className="font-display text-2xl font-semibold text-accent-strong sm:text-3xl">Para quem é</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted">
              Para quem participa das decisões que movem uma operação rural.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-2.5">
              {extra.audienceExamples.map((a) => (
                <span
                  key={a}
                  className="rounded-full border border-[color-mix(in_srgb,var(--accent)_30%,transparent)] bg-surface px-4 py-2 text-sm font-medium text-accent-strong"
                >
                  {a}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}
      <SectionDivider fromColor="var(--surface-2)" toColor="var(--bg)" flip />

 {/* RODA DE CONVERSA */}
{extra.speakers.length > 0 && (
  <section className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
    <h2 className="text-center font-display text-3xl font-semibold text-accent-strong">
      Conheça nossas palestrantes
    </h2>

    <p className="mx-auto mt-3 max-w-2xl text-center text-base text-muted">
      Experiência contábil e tributária para uma conversa
      sobre o presente e o futuro do agronegócio.
    </p>

    <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
      {extra.speakers.map((s) => {
        const foto = s.photoUrl || fotosPalestrantes[s.name];
        const apresentacao = apresentacoesPalestrantes[s.name];

        return (
          <article
  key={s.name}
  className="flex flex-col overflow-hidden rounded-2xl border border-[#b69a58]/30 bg-surface shadow-sm"
>
            <div
              className="h-1.5"
              style={{
                background:
                  "linear-gradient(90deg, var(--accent), var(--amber))",
              }}
              aria-hidden="true"
            />

            <div className="bg-surface-2">
              {foto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={foto}
                  alt={s.name}
                 className="h-[420px] w-full object-cover object-top"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-80 items-center justify-center bg-accent-soft font-display text-6xl text-accent-strong">
                  {s.name.charAt(0)}
                </div>
              )}
            </div>

            <div className="flex flex-1 flex-col p-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-accent-strong">
                Palestrante
              </p>

              <h3 className="mt-2 font-display text-2xl font-semibold text-ink">
                {s.name}
              </h3>

              {apresentacao?.biografia && (
                <p className="mt-4 text-sm leading-7 text-muted">
                  {apresentacao.biografia}
                </p>
              )}

              {apresentacao?.temas?.length ? (
                <div className="mt-auto pt-6">
                  <div className="rounded-xl bg-accent-soft p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-accent-strong">
                      Temas da participação
                    </p>

                    <ul className="mt-3 list-disc space-y-2 pl-4 text-sm leading-6 text-accent-strong">
                      {apresentacao.temas.map((tema) => (
                        <li key={tema}>{tema}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  </section>
)}
      {extra.schedule.length > 0 && <SectionDivider fromColor="var(--accent-strong)" toColor="var(--bg)" flip />}

      {/* DIAGNÓSTICO */}
      {extra.diagnosticDescription && (
        <section className="mx-auto max-w-2xl px-5 py-16 sm:py-20">
          <div className="rounded-2xl border border-[color-mix(in_srgb,var(--amber)_35%,transparent)] bg-[color-mix(in_srgb,var(--amber)_7%,var(--surface))] p-8 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-soft text-amber">
              <IconSparkle className="h-6 w-6" />
            </div>
            <h2 className="mt-4 font-display text-2xl font-semibold text-accent-strong sm:text-3xl">
              Diagnóstico gratuito
            </h2>
            <p className="mt-4 text-sm text-ink">{extra.diagnosticDescription}</p>
            {extra.diagnosticPending && (
              <p className="mt-3 text-xs text-muted">Os detalhes de como funciona serão confirmados em breve.</p>
            )}
          </div>
        </section>
      )}

      <SectionDivider fromColor="var(--bg)" toColor="var(--surface-2)" />

      {/* CTA FINAL + FORMULÁRIO */}
      <section id="inscricao" className="bg-surface-2 px-5 py-16 sm:py-20">
        <div className="mx-auto max-w-md text-center">
          <h2 className="font-display text-2xl font-semibold text-accent-strong sm:text-3xl">
            {campaign.cta || "Quero participar"}
          </h2>
          <p className="mt-2 text-sm text-muted">
            {remainingSeats != null
              ? `Restam ${remainingSeats} vagas de ${displayCapacity} — leva menos de 1 minuto.`
              : displayCapacity
                ? `Vagas limitadas a ${displayCapacity} pessoas — leva menos de 1 minuto.`
                : "Leva menos de 1 minuto."}
          </p>
        </div>
        <div className="mx-auto mt-8 max-w-md">
          <RegistrationForm
            campaignId={campaign.id}
            ctaLabel={campaign.cta || "Quero participar"}
            whatsappGroupUrl={extra.whatsappGroupUrl}
          />
        </div>
      </section>

      <footer className="flex items-center justify-center gap-2 bg-surface-2 px-5 pb-8 text-center text-xs text-muted">
        <IconLeaf className="h-3.5 w-3.5 text-accent" />
        {BRAND.fullName} · {campaign.eventLocation}
      </footer>
    </main>
  );
}
