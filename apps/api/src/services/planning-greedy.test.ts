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

  it("répartit ~80/20 entre enfants et parents pondérés (règle métier 5)", () => {
    // 1 enfant (poids 0.8) + 1 parent (poids 0.2) — sur 100 occurrences à
    // charge égale, le parent doit recevoir environ 20% du volume, pas 50%.
    const pool: GreedyChild[] = [
      { id: "child-1", weight: 0.8 },
      { id: "parent-1", weight: 0.2 },
    ];

    const assignments = generatePlanningGreedy(
      [task({ frequency: "daily", points: 1 })],
      pool,
      new Date("2026-01-01"),
      new Date("2026-04-10"), // 100 jours
    );

    const parentCount = assignments.filter(
      (a) => a.assignedToMemberId === "parent-1",
    ).length;

    expect(assignments).toHaveLength(100);
    expect(parentCount).toBeGreaterThanOrEqual(18);
    expect(parentCount).toBeLessThanOrEqual(22);
  });

  it("poids égaux par défaut = comportement identique à la charge brute", () => {
    // Sans weight explicite, la pondération ne doit rien changer par
    // rapport à l'équilibrage historique (rétrocompatibilité).
    const assignments = generatePlanningGreedy(
      [task({ frequency: "daily", points: 10 })],
      children,
      new Date("2026-07-06"),
      new Date("2026-07-07"),
    );

    const assignedIds = assignments.map((a) => a.assignedToMemberId).sort();
    expect(assignedIds).toEqual(["alice", "tom"]);
  });

  it("1 seul créneau (soir) un jour d'école, sans dayTypes fourni (rétrocompatible)", () => {
    const assignments = generatePlanningGreedy(
      [task({ frequency: "daily" })],
      children,
      new Date("2026-07-06"),
      new Date("2026-07-06"),
    );

    expect(assignments).toHaveLength(1);
    expect(assignments[0]?.slot).toBe("EVENING");
    expect(assignments[0]?.date.getHours()).toBe(19);
  });

  it("2 créneaux (midi + soir) un jour OFF_DAY pour une tâche quotidienne", () => {
    const dayTypes = new Map([["2026-07-06", "OFF_DAY" as const]]);

    const assignments = generatePlanningGreedy(
      [task({ frequency: "daily" })],
      children,
      new Date("2026-07-06"),
      new Date("2026-07-06"),
      new Map(),
      dayTypes,
    );

    expect(assignments).toHaveLength(2);
    const slots = assignments.map((a) => a.slot).sort();
    expect(slots).toEqual(["EVENING", "NOON"]);
    const noon = assignments.find((a) => a.slot === "NOON");
    expect(noon?.date.getHours()).toBe(12);
  });

  it("reste à 1 créneau (soir) un OFF_DAY pour une tâche hebdomadaire/mensuelle", () => {
    const dayTypes = new Map([["2026-07-06", "OFF_DAY" as const]]);

    const assignments = generatePlanningGreedy(
      [task({ frequency: "weekly" })],
      children,
      new Date("2026-07-06"),
      new Date("2026-07-06"),
      new Map(),
      dayTypes,
    );

    expect(assignments).toHaveLength(1);
    expect(assignments[0]?.slot).toBe("EVENING");
  });

  it("mix école/OFF_DAY sur une semaine — le nombre d'occurrences reflète les créneaux", () => {
    // Lundi-vendredi école (1 créneau), samedi-dimanche OFF_DAY (2 créneaux)
    const dayTypes = new Map<string, "SCHOOL_DAY" | "OFF_DAY">([
      ["2026-07-06", "SCHOOL_DAY"], // lundi
      ["2026-07-07", "SCHOOL_DAY"],
      ["2026-07-08", "SCHOOL_DAY"],
      ["2026-07-09", "SCHOOL_DAY"],
      ["2026-07-10", "SCHOOL_DAY"], // vendredi
      ["2026-07-11", "OFF_DAY"], // samedi
      ["2026-07-12", "OFF_DAY"], // dimanche
    ]);

    const assignments = generatePlanningGreedy(
      [task({ frequency: "daily" })],
      children,
      new Date("2026-07-06"),
      new Date("2026-07-12"),
      new Map(),
      dayTypes,
    );

    // 5 jours × 1 créneau + 2 jours × 2 créneaux = 9
    expect(assignments).toHaveLength(9);
  });
});
