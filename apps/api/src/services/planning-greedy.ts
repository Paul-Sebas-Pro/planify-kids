/**
 * Algorithme greedy de génération de planning.
 *
 * - Priorité aux tâches obligatoires, puis par difficulté décroissante.
 * - Pour chaque (tâche, date), assigne l'enfant avec la charge cumulée (points) la plus faible.
 * - Aucune dépendance DB — fonction pure, testable indépendamment.
 */

export interface GreedyTask {
  id: string;
  frequency: string;
  points: number;
  isMandatory: boolean;
  difficulty: number;
}

export interface GreedyChild {
  id: string;
}

export interface GreedyAssignment {
  taskTemplateId: string;
  assignedToMemberId: string;
  date: Date;
}

export function generatePlanningGreedy(
  tasks: GreedyTask[],
  children: GreedyChild[],
  startDate: Date,
  endDate: Date,
): GreedyAssignment[] {
  if (children.length === 0 || tasks.length === 0) return [];

  // Tâches prioritaires : obligatoires d'abord, puis difficulté décroissante
  const sorted = [...tasks].sort((a, b) => {
    if (a.isMandatory !== b.isMandatory) return a.isMandatory ? -1 : 1;
    return b.difficulty - a.difficulty;
  });

  // Génère toutes les occurrences (tâche, date) sur la plage
  const occurrences: { taskTemplateId: string; date: Date; points: number }[] =
    [];

  for (const task of sorted) {
    for (const date of getOccurrences(task.frequency, startDate, endDate)) {
      occurrences.push({ taskTemplateId: task.id, date, points: task.points });
    }
  }

  // Tri chronologique pour un planning cohérent
  occurrences.sort((a, b) => a.date.getTime() - b.date.getTime());

  // Charge cumulée par enfant (en points)
  const load = new Map<string, number>(children.map((c) => [c.id, 0]));

  const assignments: GreedyAssignment[] = [];

  for (const occ of occurrences) {
    const chosen = leastLoadedChild(load);
    assignments.push({
      taskTemplateId: occ.taskTemplateId,
      assignedToMemberId: chosen,
      date: occ.date,
    });
    load.set(chosen, (load.get(chosen) ?? 0) + occ.points);
  }

  return assignments;
}

function leastLoadedChild(load: Map<string, number>): string {
  let minLoad = Infinity;
  let chosen = "";
  for (const [id, pts] of load) {
    if (pts < minLoad) {
      minLoad = pts;
      chosen = id;
    }
  }
  return chosen;
}

function getOccurrences(
  frequency: string,
  start: Date,
  end: Date,
): Date[] {
  const dates: Date[] = [];
  const cur = new Date(start);

  if (frequency === "daily") {
    while (cur <= end) {
      dates.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
  } else if (frequency === "weekly") {
    while (cur <= end) {
      dates.push(new Date(cur));
      cur.setDate(cur.getDate() + 7);
    }
  } else if (frequency === "monthly") {
    while (cur <= end) {
      dates.push(new Date(cur));
      cur.setMonth(cur.getMonth() + 1);
    }
  }

  return dates;
}
