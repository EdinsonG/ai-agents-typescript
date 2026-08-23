import { EvalSuiteResult } from './types.js';

const PASS_ICON = '✓';
const FAIL_ICON = '✗';

/**
 * Formatea el resultado de una suite para consola/CI.
 */
export function formatSuiteReport(suite: EvalSuiteResult): string {
  const lines: string[] = [];

  lines.push(`📊 Suite: ${suite.name}`);
  lines.push('─'.repeat(72));

  for (const result of suite.results) {
    const icon = result.passed ? PASS_ICON : FAIL_ICON;
    lines.push(`${icon} ${result.caseId} — ${result.scorePercent}% (umbral ${result.threshold}%)`);

    for (const verdict of result.verdicts) {
      const verdictIcon = verdict.score === 2 ? PASS_ICON : verdict.score === 1 ? '◐' : FAIL_ICON;
      lines.push(`    ${verdictIcon} ${verdict.id}: ${verdict.score}/2 — ${verdict.reason}`);
    }

    if (result.failedChecks.length > 0) {
      for (const check of result.failedChecks) {
        lines.push(`    ✗ check determinista: ${check}`);
      }
    }
  }

  lines.push('─'.repeat(72));
  lines.push(
    `Resultado: ${suite.passedCount}/${suite.results.length} casos aprobados · puntuación media ${suite.averageScore}%`,
  );

  return lines.join('\n');
}
