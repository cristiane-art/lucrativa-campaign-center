import { notFound } from "next/navigation";
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

export default async function InscricaoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = await db.campaign.findUnique({ where: { id } });
  if (!campaign) notFound();

  const extra = parseBriefingExtra(campaign.briefingExtra);
  const dateLabel = formatEventDate(campaign.eventDate);
  const displayCapacity = extra.landingCapacityLabel ?? campaign.eventCapacity;

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
              <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 backdrop-blur-sm">
                <IconPin className="h-4 w-4 text-amber" />
                {campaign.eventLocation}
              </span>
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
              Vagas limitadas · encontro para até {displayCapacity} pessoas
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
        <section className="mx-auto max-w-4xl px-5 py-16 sm:py-20">
          <h2 className="text-center font-display text-2xl font-semibold text-accent-strong sm:text-3xl">
            Roda de conversa
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-sm text-muted">
            Profissionais com mais de 20 anos de experiência, num formato próximo e sem enrolação.
          </p>
          <div className="mx-auto mt-10 flex max-w-3xl flex-wrap justify-center gap-5">
            {extra.speakers.map((s) => (
              <div
                key={s.name}
                className="relative w-full overflow-hidden rounded-2xl border border-border bg-surface p-6 text-center shadow-sm transition-shadow hover:shadow-md sm:w-[calc(50%-0.625rem)]"
              >
                <span
                  className="absolute inset-x-0 top-0 h-1"
                  style={{ background: "linear-gradient(90deg, var(--accent), var(--amber))" }}
                  aria-hidden
                />
                {s.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={s.photoUrl}
                    alt={s.name}
                    className="mx-auto h-16 w-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent-soft font-display text-xl font-semibold text-accent-strong">
                    {s.name.charAt(0)}
                  </div>
                )}
                <p className="mt-4 font-display text-lg font-semibold text-ink">{s.name}</p>
                {s.topicPending ? (
                  <span className="mt-2 inline-block rounded-full bg-amber-soft px-3 py-1 text-xs font-medium text-amber">
                    Tema em definição
                  </span>
                ) : (
                  <p className="mt-2 text-sm text-muted">{s.specialty}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
      {extra.schedule.length > 0 && <SectionDivider fromColor="var(--bg)" toColor="var(--accent-strong)" />}

      {/* PROGRAMAÇÃO / NETWORKING */}
      {extra.schedule.length > 0 && (
        <section className="bg-accent-strong py-16 text-white sm:py-20">
          <div className="mx-auto max-w-2xl px-5">
            <h2 className="text-center font-display text-2xl font-semibold sm:text-3xl">Programação</h2>
            <div className="relative mt-10 space-y-8">
              <div
                className="absolute inset-y-3 left-4 w-px bg-[color-mix(in_srgb,var(--amber)_40%,transparent)]"
                aria-hidden
              />
              {extra.schedule.map((item, i) => {
                const Icon = scheduleIcon(item.label);
                return (
                  <div key={i} className="relative flex items-start gap-5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber text-[#12301c]">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-display text-base font-semibold text-amber">{item.time}</p>
                      <p className="mt-0.5 text-sm text-white/85">{item.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            {extra.networkingHighlight && (
              <p className="mt-4 text-center text-sm text-white/70">{extra.networkingHighlight}</p>
            )}
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
            {displayCapacity
              ? `Vagas limitadas a ${displayCapacity} pessoas — leva menos de 1 minuto.`
              : "Leva menos de 1 minuto."}
          </p>
        </div>
        <div className="mx-auto mt-8 max-w-md">
          <RegistrationForm campaignId={campaign.id} ctaLabel={campaign.cta || "Quero participar"} />
        </div>
      </section>

      <footer className="flex items-center justify-center gap-2 bg-surface-2 px-5 pb-8 text-center text-xs text-muted">
        <IconLeaf className="h-3.5 w-3.5 text-accent" />
        {BRAND.fullName} · {campaign.eventLocation}
      </footer>
    </main>
  );
}
