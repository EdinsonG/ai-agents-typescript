import { z } from 'zod';

const TestStrategySchema = z.object({
  type: z.enum(['unit', 'integration', 'e2e', 'performance', 'security']),
  scope: z.string().min(1),
  tools: z.array(z.string().min(1)).min(1),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
});

const TestCaseSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(['happy-path', 'edge-case', 'error-path', 'security', 'performance']),
  precondition: z.string().min(1),
  steps: z.array(z.string().min(1)).min(1),
  expectedResult: z.string().min(1),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  automationEffort: z.enum(['low', 'medium', 'high']),
});

const BugReportSchema = z.object({
  severity: z.enum(['critical', 'major', 'minor', 'trivial']),
  category: z.enum(['functional', 'security', 'performance', 'usability', 'compatibility']),
  title: z.string().min(1),
  description: z.string().min(1),
  stepsToReproduce: z.array(z.string().min(1)).min(1),
  expectedBehavior: z.string().min(1),
  actualBehavior: z.string().min(1),
  suggestedFix: z.string().optional(),
});

const QualityGateSchema = z.object({
  name: z.string().min(1),
  status: z.enum(['pass', 'fail', 'warning']),
  criteria: z.array(z.string().min(1)).min(1),
  notes: z.string().optional(),
});

export const TestPlanSchema = z.object({
  summary: z.string().min(1),
  strategies: z.array(TestStrategySchema).min(1),
  testCases: z.array(TestCaseSchema).min(1),
  riskAreas: z.array(z.string().min(1)).min(1),
  coverageGoals: z.object({
    statements: z.number().min(0).max(100),
    branches: z.number().min(0).max(100),
    functions: z.number().min(0).max(100),
  }),
  estimatedEffort: z.string().min(1),
  dependencies: z.array(z.string().min(1)),
});

export const CodeReviewSchema = z.object({
  summary: z.string().min(1),
  issues: z
    .array(
      z.object({
        severity: z.enum(['critical', 'major', 'minor']),
        category: z.enum(['security', 'performance', 'correctness', 'maintainability', 'testing']),
        file: z.string().optional(),
        line: z.number().int().positive().optional(),
        description: z.string().min(1),
        suggestion: z.string().min(1),
      }),
    )
    .min(0),
  qualityGates: z.array(QualityGateSchema).min(1),
  verdict: z.enum(['approve', 'request-changes', 'needs-discussion']),
  overallScore: z.number().min(0).max(10),
});

export const BugBashSchema = z.object({
  summary: z.string().min(1),
  bugs: z.array(BugReportSchema).min(0),
  totalFound: z.number().int().min(0),
  criticalCount: z.number().int().min(0),
  recommendations: z.array(z.string().min(1)).min(1),
});

export type TestPlan = z.infer<typeof TestPlanSchema>;
export type CodeReview = z.infer<typeof CodeReviewSchema>;
export type BugBash = z.infer<typeof BugBashSchema>;
