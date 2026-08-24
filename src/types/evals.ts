/**
 * Contratos del harness de evaluación: casos dorados, rúbricas y resultados.
 */

/** Criterio verificable de una rúbrica de evaluación. */
export interface EvalRubricCriterion {
  /** Identificador estable del criterio (se usa en los veredictos) */
  id: string;
  /** Requisito que debe cumplir la salida, redactado de forma verificable */
  requirement: string;
}

/** Verificación determinista y barata (sin LLM) sobre la salida cruda. */
export interface DeterministicCheck {
  name: string;
  test: (output: string) => boolean;
}

/** Caso dorado: entrada fija + rúbrica con la que se juzga la calidad. */
export interface EvalCase {
  id: string;
  input: string;
  /** Skills expertas a activar para este caso */
  skills?: readonly string[];
  rubric: EvalRubricCriterion[];
  deterministicChecks?: DeterministicCheck[];
  /** Puntuación mínima (0-100) para aprobar. Default: 70 */
  threshold?: number;
}

export interface CriterionVerdict {
  id: string;
  /** 0 = no cumple, 1 = parcial, 2 = pleno */
  score: 0 | 1 | 2;
  reason: string;
}

export interface CaseEvalResult {
  caseId: string;
  passed: boolean;
  scorePercent: number;
  threshold: number;
  verdicts: CriterionVerdict[];
  failedChecks: string[];
  outputPreview: string;
}

export interface EvalSuiteResult {
  name: string;
  results: CaseEvalResult[];
  averageScore: number;
  passedCount: number;
}

export type EvalExecutor = (testCase: EvalCase) => Promise<string>;
