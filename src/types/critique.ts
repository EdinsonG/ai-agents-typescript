/**
 * Contratos de la autocrítica opt-in: generar → juzgar → revisar.
 */

import type { CriterionVerdict, EvalRubricCriterion, ExecuteOptions } from './index.js';

export interface CritiqueOptions extends ExecuteOptions {
  /** Criterios de calidad que la salida debe cumplir */
  rubric: EvalRubricCriterion[];
  /** Puntuación mínima (0-100) para aceptar sin revisión. Default: 80 */
  threshold?: number;
  /** Si la puntuación queda bajo el umbral, revisa una vez. Default: true */
  revise?: boolean;
}

export interface CritiqueResult {
  input: string;
  /** Mejor salida (la de mayor puntuación entre original y revisión) */
  output: string;
  initialScore: number;
  finalScore: number;
  revised: boolean;
  verdicts: CriterionVerdict[];
}
