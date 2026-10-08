import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockFamilies, mockItems, mockReminder, mockForgotten } = vi.hoisted(() => ({
  mockFamilies: vi.fn(),
  mockItems: vi.fn(),
  mockReminder: vi.fn(),
  mockForgotten: vi.fn(),
}));

vi.mock("../config/database", () => ({
  prisma: {
    family: { findMany: mockFamilies },
    scheduleItem: { findMany: mockItems },
  },
}));
vi.mock("../modules/notifications/notifications.service", () => ({
  notifyTasksReminder: mockReminder,
  notifyTasksForgotten: mockForgotten,
}));
vi.mock("../modules/planning/planning.service", () => ({
  generatePlanningService: vi.fn(),
}));
vi.mock("./school-calendar", () => ({ syncCalendarZone: vi.fn() }));

import { runTaskReminders, runForgottenTasks } from "./planning-cron.js";

const paris = { id: "fam-paris", schoolZone: "ZONE_C", timezone: "Europe/Paris" };
const guadeloupe = { id: "fam-gp", schoolZone: "GUADELOUPE", timezone: "Europe/Paris" };
const noumea = { id: "fam-nc", schoolZone: "NOUVELLE_CALEDONIE", timezone: "Europe/Paris" };

beforeEach(() => {
  vi.clearAllMocks();
  mockFamilies.mockResolvedValue([paris, guadeloupe, noumea]);
  mockItems.mockImplementation(async ({ where }: any) =>
    where.schedule.familyId.in.map((familyId: string) => ({
      assignedToMemberId: `child-${familyId}`,
      schedule: { familyId },
    })),
  );
});

const queriedFamilies = () =>
  mockItems.mock.calls.flatMap((c: any) => c[0].where.schedule.familyId.in);

describe("rappels à 8 h dans le fuseau de chaque famille", () => {
  it("06:30 UTC en été — 8 h à Paris : seule la famille parisienne", async () => {
    const { notified } = await runTaskReminders(new Date("2026-07-15T06:30:00Z"));

    expect(queriedFamilies()).toEqual(["fam-paris"]);
    expect(mockReminder).toHaveBeenCalledWith("child-fam-paris", "fam-paris", 1);
    expect(notified).toBe(1);
  });

  it("12:30 UTC — 8 h en Guadeloupe : seule la famille guadeloupéenne", async () => {
    await runTaskReminders(new Date("2026-07-15T12:30:00Z"));

    expect(queriedFamilies()).toEqual(["fam-gp"]);
    expect(mockItems.mock.calls[0]?.[0].where.date.gte.toISOString()).toBe(
      "2026-07-15T00:00:00.000Z",
    );
  });

  it("21:30 UTC — 8 h à Nouméa, le LENDEMAIN : tâches du jour local", async () => {
    await runTaskReminders(new Date("2026-07-15T21:30:00Z"));

    expect(queriedFamilies()).toEqual(["fam-nc"]);
    expect(mockItems.mock.calls[0]?.[0].where.date.gte.toISOString()).toBe(
      "2026-07-16T00:00:00.000Z",
    );
  });

  it("aucune famille à 8 h — aucune requête de tâches", async () => {
    const { notified } = await runTaskReminders(new Date("2026-07-15T03:00:00Z"));

    expect(mockItems).not.toHaveBeenCalled();
    expect(notified).toBe(0);
  });
});

describe("tâches oubliées à 20 h dans le fuseau de chaque famille", () => {
  it("18:30 UTC en été — 20 h à Paris", async () => {
    await runForgottenTasks(new Date("2026-07-15T18:30:00Z"));

    expect(queriedFamilies()).toEqual(["fam-paris"]);
    expect(mockForgotten).toHaveBeenCalledOnce();
  });

  it("19:30 UTC en hiver — 20 h à Paris (heure d'hiver)", async () => {
    await runForgottenTasks(new Date("2026-01-15T19:30:00Z"));

    expect(queriedFamilies()).toEqual(["fam-paris"]);
  });

  it("00:30 UTC — 20 h en Guadeloupe, jour local = la veille UTC", async () => {
    await runForgottenTasks(new Date("2026-07-16T00:30:00Z"));

    expect(queriedFamilies()).toEqual(["fam-gp"]);
    expect(mockItems.mock.calls[0]?.[0].where.date.gte.toISOString()).toBe(
      "2026-07-15T00:00:00.000Z",
    );
  });
});
