/**
 * Contratos de la autocrítica opt-in: generar → juzgar → revisar.
 */

import type { CriterionVerdict, EvalRubricCriterion, ExecuteOptions } from './index.js';

export interface CritiqueOptions extends ExecuteOptions {
  /** Criterios de calidad que la salida debe cumplir */
  rubric: EvalRubricCriterion[];
  /** Puntuación mínima (0-100) para aceptar sin revisión. Default: 80 */
  threshold?: number;
  /** Si la puntuación queda bajo el umbral, revisa. Default: true */
  revise?: boolean;
  /** Número máximo de rondas de revisión. Default: 2 */
  maxRevisions?: number;
}

export interface CritiqueResult {
  input: string;
  /** Mejor salida (la de mayor puntuación entre original y revisiones) */
  output: string;
  initialScore: number;
  finalScore: number;
  /** Número de revisiones realizadas */
  revisionsDone: number;
  revised: boolean;
  verdicts: CriterionVerdict[];
}
