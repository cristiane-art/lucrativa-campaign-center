// Gera um arquivo .ics (formato padrão de convite de calendário) a partir
// dos dados do evento — sem depender de nenhum serviço externo.

function pad(n: number) {
  return String(n).padStart(2, "0");
}

// Formato "floating time" (sem Z, sem TZID) — os apps de calendário
// interpretam no fuso horário local do dispositivo, correto aqui porque
// participante e evento estão sempre na mesma região.
function toIcsDate(date: Date) {
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(
    date.getUTCHours()
  )}${pad(date.getUTCMinutes())}00`;
}

// Extrai até dois horários "HH:MM" de um texto livre tipo "18:30 às 21:30".
function parseTimeRange(eventTime: string | null): { startMin: number; endMin: number | null } | null {
  if (!eventTime) return null;
  const matches = [...eventTime.matchAll(/(\d{1,2}):(\d{2})/g)];
  if (matches.length === 0) return null;
  const toMinutes = (h: string, m: string) => Number(h) * 60 + Number(m);
  const startMin = toMinutes(matches[0][1], matches[0][2]);
  const endMin = matches[1] ? toMinutes(matches[1][1], matches[1][2]) : null;
  return { startMin, endMin };
}

function escapeIcsText(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");
}

export function buildEventIcs({
  uid,
  title,
  description,
  location,
  eventDate,
  eventTime,
}: {
  uid: string;
  title: string;
  description?: string | null;
  location?: string | null;
  eventDate: Date;
  eventTime?: string | null;
}): string {
  const range = parseTimeRange(eventTime ?? null);
  const start = new Date(eventDate);
  const end = new Date(eventDate);

  if (range) {
    start.setUTCHours(0, range.startMin, 0, 0);
    end.setUTCHours(0, range.endMin ?? range.startMin + 120, 0, 0);
  } else {
    // Sem horário informado — evento de dia inteiro (nunca inventa um horário).
    end.setUTCDate(end.getUTCDate() + 1);
  }

  const now = toIcsDate(new Date());
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Lucrattiva Contabilidade//Central de Campanhas//PT-BR",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    range ? `DTSTART:${toIcsDate(start)}` : `DTSTART;VALUE=DATE:${toIcsDate(start).slice(0, 8)}`,
    range ? `DTEND:${toIcsDate(end)}` : `DTEND;VALUE=DATE:${toIcsDate(end).slice(0, 8)}`,
    `SUMMARY:${escapeIcsText(title)}`,
    description ? `DESCRIPTION:${escapeIcsText(description)}` : null,
    location ? `LOCATION:${escapeIcsText(location)}` : null,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);

  return lines.join("\r\n");
}
