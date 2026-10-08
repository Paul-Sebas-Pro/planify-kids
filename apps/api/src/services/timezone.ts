import type { CalendarZone } from "@prisma/client";

// Fuseau horaire d'une famille, déduit de sa zone scolaire (déjà choisie par
// le parent dans les Paramètres) : pas de réglage supplémentaire à demander.
// Sans zone, repli sur `Family.timezone` (défaut "Europe/Paris").
const ZONE_TIMEZONES: Record<CalendarZone, string> = {
  ZONE_A: "Europe/Paris",
  ZONE_B: "Europe/Paris",
  ZONE_C: "Europe/Paris",
  GUADELOUPE: "America/Guadeloupe",
  GUYANE: "America/Cayenne",
  MARTINIQUE: "America/Martinique",
  LA_REUNION: "Indian/Reunion",
  MAYOTTE: "Indian/Mayotte",
  NOUVELLE_CALEDONIE: "Pacific/Noumea",
  // Tahiti : les Marquises (UTC−9:30) et les Gambier (UTC−9) ne sont pas
  // distinguées, faute de zone scolaire dédiée.
  POLYNESIE_FRANCAISE: "Pacific/Tahiti",
  SAINT_PIERRE_ET_MIQUELON: "America/Miquelon",
  WALLIS_ET_FUTUNA: "Pacific/Wallis",
};

export function familyTimezone(family: {
  schoolZone: CalendarZone | null;
  timezone: string;
}): string {
  return family.schoolZone ? ZONE_TIMEZONES[family.schoolZone] : family.timezone;
}

interface LocalParts {
  year: number;
  month: number;
  day: number;
  hour: number;
}

// Date/heure civile dans un fuseau donné, indépendamment du fuseau du serveur
// (UTC sur Vercel, Europe/Paris en Docker local).
function localParts(date: Date, timeZone: string): LocalParts {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value);
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
  };
}

/** Jour civil ("YYYY-MM-DD") de `date` dans le fuseau `timeZone`. */
export function localDayKey(date: Date, timeZone: string): string {
  const { year, month, day } = localParts(date, timeZone);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Heure civile (0-23) de `date` dans le fuseau `timeZone`. */
export function localHour(date: Date, timeZone: string): number {
  return localParts(date, timeZone).hour;
}

/** Jour civil précédent d'une clé "YYYY-MM-DD" (calcul calendaire pur). */
export function previousDayKey(key: string): string {
  const d = new Date(`${key}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Bornes d'un jour NOMINAL de planning. Les `ScheduleItem.date` portent le
 * jour du planning dans leur partie date UTC (créneaux midi/soir posés sur ce
 * jour) — c'est aussi ce que la tablette compare (`date LIKE 'YYYY-MM-DD%'`).
 */
export function scheduleDayRange(dayKey: string): { start: Date; end: Date } {
  return {
    start: new Date(`${dayKey}T00:00:00.000Z`),
    end: new Date(`${dayKey}T23:59:59.999Z`),
  };
}
