import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockUpsert, mockFindFirst, mockFindMany } = vi.hoisted(() => ({
  mockUpsert: vi.fn(),
  mockFindFirst: vi.fn(),
  mockFindMany: vi.fn(),
}));

vi.mock("../config/database", () => ({
  prisma: {
    schoolCalendarCache: {
      upsert: mockUpsert,
      findFirst: mockFindFirst,
      findMany: mockFindMany,
    },
  },
}));

import { syncCalendarZone, getOffDays, classifyDays } from "./school-calendar.js";

const joursFeriesResponse = () =>
  new Response(JSON.stringify({ "2026-01-01": "1er janvier" }), { status: 200 });

const vacancesResponse = () =>
  new Response(
    JSON.stringify({
      records: [
        {
          fields: {
            start_date: "2026-02-07",
            end_date: "2026-02-08",
            description: "Vacances d'Hiver",
          },
        },
      ],
    }),
    { status: 200 },
  );

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) => {
      if (url.includes("calendrier.api.gouv.fr")) return Promise.resolve(joursFeriesResponse());
      if (url.includes("data.education.gouv.fr")) return Promise.resolve(vacancesResponse());
      throw new Error(`URL non mockée: ${url}`);
    }),
  );
});

describe("syncCalendarZone", () => {
  it("upsert un jour férié par année interrogée (2) et un jour de vacances par jour de la période", async () => {
    await syncCalendarZone("ZONE_A");

    const holidayCalls = mockUpsert.mock.calls.filter(
      ([arg]) => arg.create.type === "HOLIDAY",
    );
    const vacationCalls = mockUpsert.mock.calls.filter(
      ([arg]) => arg.create.type === "VACATION",
    );

    expect(holidayCalls).toHaveLength(2); // année courante + année suivante
    expect(vacationCalls.length).toBeGreaterThanOrEqual(1);
    expect(holidayCalls[0]?.[0].create).toMatchObject({
      zone: "ZONE_A",
      type: "HOLIDAY",
      label: "1er janvier",
    });
  });

  it("interroge la bonne zone jours fériés (métropole) et vacances (Zone A)", async () => {
    await syncCalendarZone("ZONE_A");

    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;
    const urls = fetchMock.mock.calls.map((args) => args[0] as string);

    expect(urls.some((u) => u.includes("/jours-feries/metropole/"))).toBe(true);
    expect(urls.some((u) => u.includes("refine.zones=Zone+A"))).toBe(true);
  });
});

describe("getOffDays", () => {
  it("synchronise (lazy-fill) si la zone n'a jamais été mise en cache", async () => {
    mockFindFirst.mockResolvedValue(null);
    mockFindMany.mockResolvedValue([{ date: new Date("2026-01-01") }]);

    const days = await getOffDays("ZONE_A", new Date("2026-01-01"), new Date("2026-01-31"));

    expect(fetch).toHaveBeenCalled();
    expect(days.has("2026-01-01")).toBe(true);
  });

  it("ne resynchronise pas si la zone a déjà du cache", async () => {
    mockFindFirst.mockResolvedValue({ id: "existing" });
    mockFindMany.mockResolvedValue([]);

    await getOffDays("ZONE_A", new Date("2026-01-01"), new Date("2026-01-31"));

    expect(fetch).not.toHaveBeenCalled();
  });
});

describe("classifyDays", () => {
  it("classe le weekend en OFF_DAY même sans jour férié/vacances en cache", async () => {
    mockFindFirst.mockResolvedValue({ id: "existing" });
    mockFindMany.mockResolvedValue([]);

    // 2026-01-05 = lundi, 2026-01-10 = samedi, 2026-01-11 = dimanche
    const result = await classifyDays("ZONE_A", new Date("2026-01-05"), new Date("2026-01-11"));

    expect(result.get("2026-01-05")).toBe("SCHOOL_DAY");
    expect(result.get("2026-01-10")).toBe("OFF_DAY");
    expect(result.get("2026-01-11")).toBe("OFF_DAY");
  });

  it("classe un jour férié en semaine en OFF_DAY", async () => {
    mockFindFirst.mockResolvedValue({ id: "existing" });
    mockFindMany.mockResolvedValue([{ date: new Date("2026-01-01") }]); // jeudi

    const result = await classifyDays("ZONE_A", new Date("2026-01-01"), new Date("2026-01-01"));

    expect(result.get("2026-01-01")).toBe("OFF_DAY");
  });
});
