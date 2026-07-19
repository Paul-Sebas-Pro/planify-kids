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
  /** Part relative de charge cible (ex: 0.8/nbEnfants, 0.2/nbParents). Défaut : parts égales. */
  weight?: number;
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
  initialLoad: Map<string, number> = new Map(),
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

  // leastLoadedChild départage les égalités par ordre d'itération de la Map :
  // sans rotation, le même 1er enfant gagnerait chaque ex-aequo à charge égale
  // (typiquement en début de semaine, ou sans historique). On fait tourner
  // l'ordre de départ selon le numéro de semaine.
  const weekIndex = Math.floor(startDate.getTime() / (7 * 24 * 3600 * 1000));
  const offset = children.length > 0 ? weekIndex % children.length : 0;
  const rotatedChildren = [...children.slice(offset), ...children.slice(0, offset)];

  const weights = new Map<string, number>(
    rotatedChildren.map((c) => [c.id, c.weight ?? 1]),
  );

  // Charge cumulée par enfant (en points), initialisée depuis l'historique réel
  // (semaines précédentes) plutôt que zéro — sinon la rotation "équitable" ne
  // s'applique qu'à l'intérieur d'une semaine, jamais entre les semaines.
  //
  // Recentrée par groupe de poids (même poids = même groupe, ex: tous les
  // enfants) sur la moyenne du groupe : un déséquilibre historique ENTRE
  // groupes (ex: les enfants faisaient déjà 100% des tâches avant l'ajout de
  // la règle 80/20, les parents partent à 0) ne doit pas écraser le ratio de
  // poids de CETTE génération — seule la fairness interne à un groupe (qui a
  // eu quoi récemment) doit être conservée.
  const groupTotals = new Map<number, { sum: number; count: number }>();
  for (const c of rotatedChildren) {
    const w = c.weight ?? 1;
    const g = groupTotals.get(w) ?? { sum: 0, count: 0 };
    g.sum += initialLoad.get(c.id) ?? 0;
    g.count += 1;
    groupTotals.set(w, g);
  }

  const load = new Map<string, number>(
    rotatedChildren.map((c) => {
      const w = c.weight ?? 1;
      const group = groupTotals.get(w);
      const groupMean = group ? group.sum / group.count : 0;
      return [c.id, (initialLoad.get(c.id) ?? 0) - groupMean];
    }),
  );

  const assignments: GreedyAssignment[] = [];

  for (const occ of occurrences) {
    const chosen = leastLoadedChild(load, weights);
    assignments.push({
      taskTemplateId: occ.taskTemplateId,
      assignedToMemberId: chosen,
      date: occ.date,
    });
    load.set(chosen, (load.get(chosen) ?? 0) + occ.points);
  }

  return assignments;
}

// Choisit l'enfant dont la charge relative à son poids cible (load / weight)
// est la plus faible — avec des poids égaux ça revient à la charge brute ;
// avec des poids différents (ex: 80/20 enfants/parents) ça répartit
// proportionnellement au poids plutôt qu'à parts égales.
function leastLoadedChild(
  load: Map<string, number>,
  weights: Map<string, number>,
): string {
  let minRatio = Infinity;
  let chosen = "";
  for (const [id, pts] of load) {
    const ratio = pts / (weights.get(id) ?? 1);
    if (ratio < minRatio) {
      minRatio = ratio;
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
