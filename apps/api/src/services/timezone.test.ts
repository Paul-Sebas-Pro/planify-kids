import { describe, it, expect } from "vitest";
import {
  familyTimezone,
  localDayKey,
  localHour,
  previousDayKey,
  scheduleDayRange,
} from "./timezone.js";

describe("familyTimezone", () => {
  it("déduit le fuseau de la zone scolaire", () => {
    expect(familyTimezone({ schoolZone: "ZONE_B", timezone: "Europe/Paris" })).toBe("Europe/Paris");
    expect(familyTimezone({ schoolZone: "GUADELOUPE", timezone: "Europe/Paris" })).toBe("America/Guadeloupe");
    expect(familyTimezone({ schoolZone: "NOUVELLE_CALEDONIE", timezone: "Europe/Paris" })).toBe("Pacific/Noumea");
  });

  it("sans zone — repli sur Family.timezone", () => {
    expect(familyTimezone({ schoolZone: null, timezone: "Indian/Reunion" })).toBe("Indian/Reunion");
  });
});

describe("localHour / localDayKey (indépendants du fuseau du serveur)", () => {
  it("Paris suit l'heure d'été et d'hiver", () => {
    expect(localHour(new Date("2026-07-15T06:00:00Z"), "Europe/Paris")).toBe(8);
    expect(localHour(new Date("2026-01-15T06:00:00Z"), "Europe/Paris")).toBe(7);
  });

  it("Guadeloupe (UTC−4, sans heure d'été)", () => {
    expect(localHour(new Date("2026-07-15T06:00:00Z"), "America/Guadeloupe")).toBe(2);
    expect(localHour(new Date("2026-01-15T06:00:00Z"), "America/Guadeloupe")).toBe(2);
  });

  it("jour local différent du jour UTC (Nouméa, Tahiti)", () => {
    const t = new Date("2026-07-15T21:30:00Z");
    expect(localDayKey(t, "Pacific/Noumea")).toBe("2026-07-16");
    expect(localDayKey(new Date("2026-07-15T06:00:00Z"), "Pacific/Tahiti")).toBe("2026-07-14");
  });
});

describe("previousDayKey / scheduleDayRange", () => {
  it("passe les fins de mois et d'année", () => {
    expect(previousDayKey("2026-03-01")).toBe("2026-02-28");
    expect(previousDayKey("2027-01-01")).toBe("2026-12-31");
  });

  it("bornes UTC du jour nominal de planning", () => {
    const { start, end } = scheduleDayRange("2026-07-15");
    expect(start.toISOString()).toBe("2026-07-15T00:00:00.000Z");
    expect(end.toISOString()).toBe("2026-07-15T23:59:59.999Z");
  });
});
