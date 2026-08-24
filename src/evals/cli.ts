import 'dotenv/config';
import { AGENT_IDS, type AgentId, createAgent } from '@/agents/index.js';
import { BACKEND_NODE_CASES } from '@/evals/golden/backendNodeCases.js';
import { FRONTEND_ANGULAR_CASES } from '@/evals/golden/frontendAngularCases.js';
import { FRONTEND_REACT_CASES } from '@/evals/golden/frontendReactCases.js';
import { TECHNICAL_PO_CASES } from '@/evals/golden/technicalPoCases.js';
import { UXUI_CASES } from '@/evals/golden/uxuiCases.js';
import { LLMJudge } from '@/evals/judge.js';
import { formatSuiteReport } from '@/evals/reporter.js';
import { EvalRunner } from '@/evals/runner.js';
import type { EvalCase } from '@/types/index.js';

const GROQ_API_KEY = process.env.GROQ_API_KEY_AGENTS;

interface SuiteDefinition {
  name: string;
  agentId: AgentId;
  cases: EvalCase[];
}

const SUITES: SuiteDefinition[] = [
  { name: 'Technical Product Owner', agentId: 'po', cases: TECHNICAL_PO_CASES },
  { name: 'Frontend React Expert', agentId: 'react', cases: FRONTEND_REACT_CASES },
  { name: 'Frontend Angular Expert', agentId: 'angular', cases: FRONTEND_ANGULAR_CASES },
  { name: 'Backend Node Expert', agentId: 'backend', cases: BACKEND_NODE_CASES },
  { name: 'UX/UI Design Expert', agentId: 'uxui', cases: UXUI_CASES },
];

async function main() {
  if (!GROQ_API_KEY) {
    console.error('❌ Error: La variable de entorno GROQ_API_KEY_AGENTS no está configurada.');
    process.exitCode = 1;
    return;
  }

  const runner = new EvalRunner(new LLMJudge(GROQ_API_KEY));
  const agents = new Map(AGENT_IDS.map((id) => [id, createAgent(id, GROQ_API_KEY)]));

  let totalPassed = 0;
  let totalCases = 0;

  for (const suite of SUITES) {
    const agent = agents.get(suite.agentId)!;
    const result = await runner.runSuite(suite.name, suite.cases, (testCase) =>
      agent.execute(testCase.input, { skills: testCase.skills }),
    );

    console.log(formatSuiteReport(result));
    console.log();

    totalPassed += result.passedCount;
    totalCases += result.results.length;
  }

  console.log(`═══ Resumen global: ${totalPassed}/${totalCases} casos aprobados ═══`);

  if (totalPassed < totalCases) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('❌ Error ejecutando las evals:', error);
  process.exitCode = 1;
});
