import { describe, expect, it } from 'vitest';
import { BACKEND_NODE_CASES } from '@/evals/golden/backendNodeCases.js';
import { FRONTEND_ANGULAR_CASES } from '@/evals/golden/frontendAngularCases.js';
import { FRONTEND_REACT_CASES } from '@/evals/golden/frontendReactCases.js';
import { TECHNICAL_PO_CASES } from '@/evals/golden/technicalPoCases.js';
import { UXUI_CASES } from '@/evals/golden/uxuiCases.js';
import type { EvalCase } from '@/evals/types.js';

const ALL_SUITES: Array<[string, EvalCase[]]> = [
  ['TechnicalPO', TECHNICAL_PO_CASES],
  ['FrontendReact', FRONTEND_REACT_CASES],
  ['FrontendAngular', FRONTEND_ANGULAR_CASES],
  ['BackendNode', BACKEND_NODE_CASES],
  ['UXUI', UXUI_CASES],
];

describe('casos dorados: estructura válida', () => {
  it.each(ALL_SUITES)('%s tiene ids únicos y rúbricas bien formadas', (_name, cases) => {
    expect(cases.length).toBeGreaterThan(0);

    const caseIds = cases.map((testCase) => testCase.id);
    expect(new Set(caseIds).size).toBe(caseIds.length);

    for (const testCase of cases) {
      expect(testCase.input.trim().length).toBeGreaterThan(10);
      expect(testCase.rubric.length).toBeGreaterThan(0);

      const rubricIds = testCase.rubric.map((criterion) => criterion.id);
      expect(new Set(rubricIds).size).toBe(rubricIds.length);

      for (const criterion of testCase.rubric) {
        expect(criterion.requirement.trim().length).toBeGreaterThan(20);
      }

      if (testCase.threshold !== undefined) {
        expect(testCase.threshold).toBeGreaterThanOrEqual(0);
        expect(testCase.threshold).toBeLessThanOrEqual(100);
      }
    }
  });
});
