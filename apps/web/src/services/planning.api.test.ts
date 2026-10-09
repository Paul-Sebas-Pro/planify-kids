import { describe, it, expect, vi, afterEach } from "vitest";
import { planningApi } from "./planning.api";

afterEach(() => vi.unstubAllGlobals());

describe("planningApi.calendar", () => {
  it("envoie des dates YYYY-MM-DD même si le planning fournit de l'ISO complet", async () => {
    const fetchMock = vi.fn(async () => Response.json({ success: true, data: [] }));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("localStorage", { getItem: () => null });

    await planningApi.calendar("2026-10-05T00:00:00.000Z", "2026-10-11T00:00:00.000Z");

    const url = String((fetchMock.mock.calls[0] as unknown[])[0]);
    expect(url).toContain("/planning/calendar?startDate=2026-10-05&endDate=2026-10-11");
  });
});
