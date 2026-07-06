import { describe, it, expect } from "vitest";
import { generatePlanningGreedy, type GreedyTask, type GreedyChild } from "./planning-greedy.js";

const task = (overrides: Partial<GreedyTask> = {}): GreedyTask => ({
  id: "task-1",
  frequency: "daily",
  points: 10,
  isMandatory: true,
  difficulty: 1,
  ...overrides,
});

const children: GreedyChild[] = [{ id: "alice" }, { id: "tom" }];

describe("generatePlanningGreedy", () => {
  it("répartit les occurrences en équilibrant la charge (comportement existant)", () => {
    const assignments = generatePlanningGreedy(
      [task({ frequency: "daily", points: 10 })],
      children,
      new Date("2026-07-06"), // lundi
      new Date("2026-07-07"), // mardi
    );

    expect(assignments).toHaveLength(2);
    const assignedIds = assignments.map((a) => a.assignedToMemberId).sort();
    expect(assignedIds).toEqual(["alice", "tom"]);
  });

  it("fait tourner le départage des égalités d'une semaine à l'autre (fix rotation)", () => {
    // Même famille, même tâche unique par semaine (charge 0-0 à chaque fois) —
    // sans rotation, "alice" gagnerait systématiquement le tie-break.
    const single = [task({ frequency: "weekly", points: 10 })];

    const week1 = generatePlanningGreedy(
      single,
      children,
      new Date("2026-07-06"), // lundi semaine N
      new Date("2026-07-12"),
    );
    const week2 = generatePlanningGreedy(
      single,
      children,
      new Date("2026-07-13"), // lundi semaine N+1
      new Date("2026-07-19"),
    );

    expect(week1[0]?.assignedToMemberId).not.toBe(week2[0]?.assignedToMemberId);
  });

  it("tient compte de l'historique (initialLoad) pour ne pas favoriser toujours le même enfant", () => {
    // Alice a déjà une lourde charge historique (ex: semaines précédentes) —
    // la nouvelle tâche doit aller à Tom malgré une charge courante 0-0.
    const initialLoad = new Map([
      ["alice", 100],
      ["tom", 0],
    ]);

    const assignments = generatePlanningGreedy(
      [task({ frequency: "weekly", points: 10 })],
      children,
      new Date("2026-07-06"),
      new Date("2026-07-12"),
      initialLoad,
    );

    expect(assignments[0]?.assignedToMemberId).toBe("tom");
  });

  it("fonctionne sans initialLoad (paramètre optionnel, rétrocompatible)", () => {
    const assignments = generatePlanningGreedy(
      [task({ frequency: "daily" })],
      children,
      new Date("2026-07-06"),
      new Date("2026-07-06"),
    );

    expect(assignments).toHaveLength(1);
  });
});
