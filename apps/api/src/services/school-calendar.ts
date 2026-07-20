/**
 * Jours fériés + vacances scolaires France & DOM-TOM, via les APIs
 * officielles gouv.fr, avec cache local (SchoolCalendarCache) pour éviter un
 * appel réseau à chaque génération de planning.
 *
 * - Jours fériés : calendrier.api.gouv.fr (13 zones, dont métropole + DOM-TOM)
 * - Vacances scolaires : data.education.gouv.fr, dataset fr-en-calendrier-scolaire
 *   (Zone A/B/C pour la métropole, zone = territoire pour les DOM-TOM)
 *
 * Ces deux APIs sont distinctes ; CalendarZone les fait correspondre via
 * JOURS_FERIES_SLUG / VACANCES_ZONE_LABEL ci-dessous.
 */

import { prisma } from "../config/database.js";
import type { CalendarZone } from "@prisma/client";

const JOURS_FERIES_SLUG: Record<CalendarZone, string> = {
  ZONE_A: "metropole",
  ZONE_B: "metropole",
  ZONE_C: "metropole",
  GUADELOUPE: "guadeloupe",
  GUYANE: "guyane",
  MARTINIQUE: "martinique",
  LA_REUNION: "la-reunion",
  MAYOTTE: "mayotte",
  NOUVELLE_CALEDONIE: "nouvelle-caledonie",
  POLYNESIE_FRANCAISE: "polynesie-francaise",
  SAINT_PIERRE_ET_MIQUELON: "saint-pierre-et-miquelon",
  WALLIS_ET_FUTUNA: "wallis-et-futuna",
};

const VACANCES_ZONE_LABEL: Record<CalendarZone, string> = {
  ZONE_A: "Zone A",
  ZONE_B: "Zone B",
  ZONE_C: "Zone C",
  GUADELOUPE: "Guadeloupe",
  GUYANE: "Guyane",
  MARTINIQUE: "Martinique",
  LA_REUNION: "Réunion",
  MAYOTTE: "Mayotte",
  NOUVELLE_CALEDONIE: "Nouvelle Calédonie",
  POLYNESIE_FRANCAISE: "Polynésie",
  SAINT_PIERRE_ET_MIQUELON: "Saint Pierre et Miquelon",
  WALLIS_ET_FUTUNA: "Wallis et Futuna",
};

const JOURS_FERIES_BASE = "https://calendrier.api.gouv.fr/jours-feries";
const VACANCES_BASE = "https://data.education.gouv.fr/api/records/1.0/search/";

async function fetchJoursFeries(
  zone: CalendarZone,
  year: number,
): Promise<{ date: string; label: string }[]> {
  const slug = JOURS_FERIES_SLUG[zone];
  const res = await fetch(`${JOURS_FERIES_BASE}/${slug}/${year}.json`);
  if (!res.ok) {
    throw new Error(`jours-feries ${slug}/${year}: HTTP ${res.status}`);
  }
  const data = (await res.json()) as Record<string, string>;
  return Object.entries(data).map(([date, label]) => ({ date, label }));
}

async function fetchVacances(
  zone: CalendarZone,
): Promise<{ start: string; end: string; label: string }[]> {
  const label = VACANCES_ZONE_LABEL[zone];
  const params = new URLSearchParams({
    dataset: "fr-en-calendrier-scolaire",
    rows: "200",
    "refine.zones": label,
    "refine.population": "Élèves",
  });
  const res = await fetch(`${VACANCES_BASE}?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`vacances ${label}: HTTP ${res.status}`);
  }
  const data = (await res.json()) as {
    records: { fields: { start_date: string; end_date: string; description: string } }[];
  };

  // Dédoublonne : plusieurs académies partagent les mêmes dates dans une zone.
  const seen = new Set<string>();
  const periods: { start: string; end: string; label: string }[] = [];
  for (const r of data.records) {
    const { start_date, end_date, description } = r.fields;
    const key = `${start_date}|${end_date}|${description}`;
    if (seen.has(key)) continue;
    seen.add(key);
    periods.push({ start: start_date, end: end_date, label: description });
  }
  return periods;
}

function eachDate(startIso: string, endIso: string): string[] {
  const dates: string[] = [];
  const cur = new Date(startIso);
  const end = new Date(endIso);
  while (cur <= end) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

/** Récupère jours fériés + vacances depuis les API gouv et met à jour le cache local. */
export async function syncCalendarZone(zone: CalendarZone): Promise<void> {
  const now = new Date();
  const years = [now.getFullYear(), now.getFullYear() + 1];

  const rows: { zone: CalendarZone; date: Date; type: "HOLIDAY" | "VACATION"; label: string }[] = [];

  for (const year of years) {
    const feries = await fetchJoursFeries(zone, year);
    for (const f of feries) {
      rows.push({ zone, date: new Date(f.date), type: "HOLIDAY", label: f.label });
    }
  }

  const vacances = await fetchVacances(zone);
  for (const period of vacances) {
    for (const day of eachDate(period.start, period.end)) {
      rows.push({ zone, date: new Date(day), type: "VACATION", label: period.label });
    }
  }

  for (const row of rows) {
    await prisma.schoolCalendarCache.upsert({
      where: { zone_date_type: { zone: row.zone, date: row.date, type: row.type } },
      create: row,
      update: { label: row.label },
    });
  }
}

// Zone jamais synchronisée (ex: serverless sans cron actif) — bootstrap.
// Note : ne rafraîchit pas une zone déjà synchronisée une fois — le cron
// (planning-cron.ts) s'en charge ; limite connue identique au cron
// planning existant, qui ne tourne pas non plus sur Vercel serverless.
async function ensureZoneSynced(zone: CalendarZone): Promise<void> {
  const hasAnyCache = await prisma.schoolCalendarCache.findFirst({
    where: { zone },
    select: { id: true },
  });
  if (!hasAnyCache) {
    await syncCalendarZone(zone);
  }
}

/** Dates (YYYY-MM-DD) non-scolaires (fériées ou vacances) pour une zone sur une plage. */
export async function getOffDays(
  zone: CalendarZone,
  startDate: Date,
  endDate: Date,
): Promise<Set<string>> {
  await ensureZoneSynced(zone);

  const rows = await prisma.schoolCalendarCache.findMany({
    where: { zone, date: { gte: startDate, lte: endDate } },
    select: { date: true },
  });

  return new Set(rows.map((r) => r.date.toISOString().slice(0, 10)));
}

export interface CalendarEntry {
  date: string;
  type: "HOLIDAY" | "VACATION";
  label: string | null;
}

/** Détail (date, type férié/vacances, libellé) pour une zone sur une plage — affichage. */
export async function getCalendarEntries(
  zone: CalendarZone,
  startDate: Date,
  endDate: Date,
): Promise<CalendarEntry[]> {
  await ensureZoneSynced(zone);

  const rows = await prisma.schoolCalendarCache.findMany({
    where: { zone, date: { gte: startDate, lte: endDate } },
    orderBy: { date: "asc" },
  });

  return rows.map((r) => ({
    date: r.date.toISOString().slice(0, 10),
    type: r.type,
    label: r.label,
  }));
}

export type DayType = "SCHOOL_DAY" | "OFF_DAY";

/** Classe chaque jour de la plage : OFF_DAY (weekend, férié ou vacances) ou SCHOOL_DAY. */
export async function classifyDays(
  zone: CalendarZone,
  startDate: Date,
  endDate: Date,
): Promise<Map<string, DayType>> {
  const offDays = await getOffDays(zone, startDate, endDate);
  const result = new Map<string, DayType>();

  const cur = new Date(startDate);
  const end = new Date(endDate);

  while (cur <= end) {
    const key = cur.toISOString().slice(0, 10);
    const isWeekend = cur.getDay() === 0 || cur.getDay() === 6;
    result.set(key, isWeekend || offDays.has(key) ? "OFF_DAY" : "SCHOOL_DAY");
    cur.setDate(cur.getDate() + 1);
  }

  return result;
}
