import type { CriterionVerdict, EvalRubricCriterion } from '@/types/index.js';

export type VerdictsById = Record<string, { score: 0 | 1 | 2; reason: string }>;

/**
 * Puntuación normalizada 0-100 de una salida contra una rúbrica.
 * Criterios sin veredicto puntúan 0.
 * Soporta pesos: criterios con weight mayor tienen más influencia.
 */
export function computeScorePercent(
  rubric: EvalRubricCriterion[],
  verdictsById: VerdictsById,
): number {
  if (rubric.length === 0) return 0;

  let totalWeightedScore = 0;
  let totalWeight = 0;

  for (const criterion of rubric) {
    const weight = criterion.weight ?? 1;
    const score = verdictsById[criterion.id]?.score ?? 0;
    totalWeightedScore += score * weight;
    totalWeight += 2 * weight; // max score por criterio = 2
  }

  if (totalWeight === 0) return 0;
  return Math.round((totalWeightedScore / totalWeight) * 100);
}

/**
 * Mapea los veredictos por id a la lista ordenada según la rúbrica.
 * Criterios omitidos por el juez se marcan con score 0.
 */
export function toVerdictList(
  rubric: EvalRubricCriterion[],
  verdictsById: VerdictsById,
): CriterionVerdict[] {
  return rubric.map((criterion) => ({
    id: criterion.id,
    ...(verdictsById[criterion.id] ?? { score: 0 as const, reason: 'No evaluado.' }),
  }));
}
