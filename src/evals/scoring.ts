import type { CriterionVerdict, EvalRubricCriterion } from '@/types/index.js';

export type VerdictsById = Record<string, { score: 0 | 1 | 2; reason: string }>;

/**
 * Puntuación normalizada 0-100 de una salida contra una rúbrica.
 * Criterios sin veredicto puntúan 0.
 */
export function computeScorePercent(
  rubric: EvalRubricCriterion[],
  verdictsById: VerdictsById,
): number {
  const scores = rubric.map((criterion) => verdictsById[criterion.id]?.score ?? 0);
  const maxScore = rubric.length * 2;
  if (maxScore === 0) return 0;

  const total = scores.reduce<number>((sum, score) => sum + score, 0);
  return Math.round((total / maxScore) * 100);
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
