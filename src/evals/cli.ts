import 'dotenv/config';
import { FrontendReactAgent } from '@/agents/FrontendReact/FrontendReactAgent.js';
import { TechnicalPOAgent } from '@/agents/TechnicalPO/TechnicalPOAgent.js';
import { LLMJudge } from '@/evals/judge.js';
import { EvalRunner } from '@/evals/runner.js';
import { formatSuiteReport } from '@/evals/reporter.js';
import { FRONTEND_REACT_CASES } from '@/evals/golden/frontendReactCases.js';
import { TECHNICAL_PO_CASES } from '@/evals/golden/technicalPoCases.js';

const GROQ_API_KEY = process.env.GROQ_API_KEY_AGENTS;

async function main() {
  if (!GROQ_API_KEY) {
    console.error('❌ Error: La variable de entorno GROQ_API_KEY_AGENTS no está configurada.');
    process.exitCode = 1;
    return;
  }

  const judge = new LLMJudge(GROQ_API_KEY);
  const runner = new EvalRunner(judge);

  const poAgent = new TechnicalPOAgent(GROQ_API_KEY);
  const reactAgent = new FrontendReactAgent(GROQ_API_KEY);

  let allPassed = true;

  const poSuite = await runner.runSuite('Technical Product Owner', TECHNICAL_PO_CASES, (testCase) =>
    poAgent.generateUserStory(testCase.input, { skills: testCase.skills }),
  );
  console.log(formatSuiteReport(poSuite));
  console.log();
  allPassed &&= poSuite.passedCount === poSuite.results.length;

  const reactSuite = await runner.runSuite(
    'Frontend React Expert',
    FRONTEND_REACT_CASES,
    (testCase) => reactAgent.implementFeature(testCase.input, { skills: testCase.skills }),
  );
  console.log(formatSuiteReport(reactSuite));
  allPassed &&= reactSuite.passedCount === reactSuite.results.length;

  if (!allPassed) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('❌ Error ejecutando las evals:', error);
  process.exitCode = 1;
});
