import type { CaseEvalResult, EvalCase, EvalExecutor, EvalSuiteResult } from '@/types/index.js';
import type { LLMJudge } from './judge.js';
import { computeScorePercent, toVerdictList } from './scoring.js';

const DEFAULT_THRESHOLD = 70;

/**
 * Ejecuta casos dorados contra un agente y los califica con un juez LLM
 * más verificaciones deterministas, produciendo resultados reproducibles.
 * Incluye error handling por caso para que un fallo no detenga toda la suite.
 */
export class EvalRunner {
  constructor(private readonly judge: LLMJudge) {}

  public async runCase(testCase: EvalCase, executor: EvalExecutor): Promise<CaseEvalResult> {
    try {
      const output = await executor(testCase);

      const failedChecks = (testCase.deterministicChecks ?? [])
        .filter((check) => !check.test(output))
        .map((check) => check.name);

      const verdicts = await this.judge.evaluate(testCase.input, output, testCase.rubric);

      const scorePercent = computeScorePercent(testCase.rubric, verdicts);
      const threshold = testCase.threshold ?? DEFAULT_THRESHOLD;

      return {
        caseId: testCase.id,
        passed: failedChecks.length === 0 && scorePercent >= threshold,
        scorePercent,
        threshold,
        verdicts: toVerdictList(testCase.rubric, verdicts),
        failedChecks,
        outputPreview: output.slice(0, 160),
      };
    } catch (error) {
      // Error handling: un fallo en un caso no detiene la suite completa
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        caseId: testCase.id,
        passed: false,
        scorePercent: 0,
        threshold: testCase.threshold ?? DEFAULT_THRESHOLD,
        verdicts: testCase.rubric.map((c) => ({
          id: c.id,
          score: 0 as const,
          reason: `Error durante la evaluación: ${errorMessage}`,
        })),
        failedChecks: [`Error: ${errorMessage}`],
        outputPreview: `[ERROR] ${errorMessage}`.slice(0, 160),
      };
    }
  }

  public async runSuite(
    name: string,
    testCases: EvalCase[],
    executor: EvalExecutor,
  ): Promise<EvalSuiteResult> {
    const results: CaseEvalResult[] = [];

    for (const testCase of testCases) {
      results.push(await this.runCase(testCase, executor));
    }

    const averageScore =
      results.length === 0
        ? 0
        : Math.round(
            results.reduce((total, result) => total + result.scorePercent, 0) / results.length,
          );

    return {
      name,
      results,
      averageScore,
      passedCount: results.filter((result) => result.passed).length,
    };
  }
}
