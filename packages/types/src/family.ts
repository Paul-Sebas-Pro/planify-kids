export type Role = "PARENT" | "CHILD";

export type CalendarZone =
  | "ZONE_A"
  | "ZONE_B"
  | "ZONE_C"
  | "GUADELOUPE"
  | "GUYANE"
  | "MARTINIQUE"
  | "LA_REUNION"
  | "MAYOTTE"
  | "NOUVELLE_CALEDONIE"
  | "POLYNESIE_FRANCAISE"
  | "SAINT_PIERRE_ET_MIQUELON"
  | "WALLIS_ET_FUTUNA";

export const CALENDAR_ZONE_LABELS: Record<CalendarZone, string> = {
  ZONE_A: "Zone A (métropole)",
  ZONE_B: "Zone B (métropole)",
  ZONE_C: "Zone C (métropole)",
  GUADELOUPE: "Guadeloupe",
  GUYANE: "Guyane",
  MARTINIQUE: "Martinique",
  LA_REUNION: "La Réunion",
  MAYOTTE: "Mayotte",
  NOUVELLE_CALEDONIE: "Nouvelle-Calédonie",
  POLYNESIE_FRANCAISE: "Polynésie française",
  SAINT_PIERRE_ET_MIQUELON: "Saint-Pierre-et-Miquelon",
  WALLIS_ET_FUTUNA: "Wallis-et-Futuna",
};

export interface Family {
  id: string;
  name: string;
  code?: string | null;
  timezone: string;
  locale: string;
  schoolZone?: CalendarZone | null;
  createdAt: string;
}

export interface FamilyMember {
  id: string;
  familyId: string;
  userId?: string;
  name: string;
  avatar?: string;
  color?: string;
  birthDate?: string;
  role: Role;
  points: number;
  /** Un PIN est défini (le hash n'est jamais renvoyé par l'API). */
  hasPin: boolean;
  /** false = connexion enfant sans PIN, choisi par le parent. */
  pinRequired: boolean;
  /** Blocage anti-force brute (5 PIN faux) en cours jusqu'à cette date. */
  pinLockedUntil?: string | null;
  createdAt: string;
}

export interface ChildStats {
  id: string;
  name: string;
  color?: string;
  avatar?: string;
  points: number;
  badges: Array<{
    earnedAt: string;
    badge: { name: string; icon: string };
  }>;
  _count: { assignments: number };
}

export interface FamilyStatsSummary {
  totalPoints: number;
  totalTasksCompleted: number;
  totalBadges: number;
}

export interface FamilyStats {
  children: ChildStats[];
  summary: FamilyStatsSummary;
}

export interface CreateMemberRequest {
  name: string;
  role: Role;
  color?: string;
  avatar?: string;
  birthDate?: string;
}
