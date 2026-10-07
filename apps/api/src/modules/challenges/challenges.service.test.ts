import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../config/database", () => ({ prisma: {} }));
vi.mock("../../services/sse.service", () => ({ sseEmit: vi.fn() }));
vi.mock("./challenges.repository", () => ({
  getChallengesByFamily: vi.fn(),
  getChallengeById: vi.fn(),
  createChallenge: vi.fn(),
  updateChallengeStatus: vi.fn(),
  getActiveChallengesForFamily: vi.fn(),
  sumPointsInPeriod: vi.fn(),
  awardBonusToAllMembers: vi.fn(),
}));

import * as repo from "./challenges.repository.js";
import { checkChallengesAfterPoints } from "./challenges.service.js";

const challenge = (id: string, targetPoints: number) => ({
  id,
  title: `Défi ${id}`,
  targetPoints,
  bonusPoints: 20,
  startDate: new Date(),
  endDate: new Date(),
});

beforeEach(() => vi.clearAllMocks());

describe("checkChallengesAfterPoints", () => {
  it("renvoie le nombre de défis réussis et ne verse que leur bonus", async () => {
    vi.mocked(repo.getActiveChallengesForFamily).mockResolvedValue([
      challenge("a", 100),
      challenge("b", 500),
    ] as any);
    vi.mocked(repo.sumPointsInPeriod).mockResolvedValue(150);

    const completed = await checkChallengesAfterPoints("family-1");

    expect(completed).toBe(1);
    expect(repo.updateChallengeStatus).toHaveBeenCalledOnce();
    expect(repo.updateChallengeStatus).toHaveBeenCalledWith(
      "a",
      "COMPLETED",
      expect.any(Date),
    );
    expect(repo.awardBonusToAllMembers).toHaveBeenCalledWith("family-1", 20);
  });

  it("aucun défi actif — 0", async () => {
    vi.mocked(repo.getActiveChallengesForFamily).mockResolvedValue([]);

    expect(await checkChallengesAfterPoints("family-1")).toBe(0);
  });
});
