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
import { globalCollector } from '@/observability/collector.js';
import { formatUsageSummary } from '@/observability/reporter.js';
import type { EvalCase, EvalSuiteResult } from '@/types/index.js';

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

/**
 * Parsea argumentos CLI simples: --provider groq --model llama-3 --format json
 */
function parseArgs(): {
  provider: string;
  model: string;
  format: 'text' | 'json';
  apiKey?: string;
} {
  const args = process.argv.slice(2);
  const result: { provider: string; model: string; format: 'text' | 'json'; apiKey?: string } = {
    provider: 'groq',
    model: 'llama-3.3-70b-versatile',
    format: 'text',
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--provider':
        result.provider = args[++i] ?? result.provider;
        break;
      case '--model':
        result.model = args[++i] ?? result.model;
        break;
      case '--format':
        result.format = (args[++i] as 'text' | 'json') ?? result.format;
        break;
      case '--api-key':
        result.apiKey = args[++i];
        break;
    }
  }

  return result;
}

async function main() {
  const parsed = parseArgs();

  // API key: flag --api-key > variable de entorno por proveedor > fallback a Groq
  const envKeyMap: Record<string, string | undefined> = {
    groq: process.env.GROQ_API_KEY_AGENTS,
    openai: process.env.OPENAI_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY,
  };

  const apiKey = parsed.apiKey ?? envKeyMap[parsed.provider] ?? process.env.GROQ_API_KEY_AGENTS;

  if (!apiKey) {
    console.error(`Error: No se encontró API key para el proveedor "${parsed.provider}".`);
    console.error('Configura la variable de entorno correspondiente o usa --api-key.');
    process.exitCode = 1;
    return;
  }

  const judge = new LLMJudge(apiKey, parsed.model);
  const runner = new EvalRunner(judge);
  const agents = new Map(AGENT_IDS.map((id) => [id, createAgent(id, apiKey)]));

  let totalPassed = 0;
  let totalCases = 0;
  const allResults: Array<{ suite: string; result: EvalSuiteResult }> = [];

  for (const suite of SUITES) {
    const agent = agents.get(suite.agentId)!;
    const result = await runner.runSuite(suite.name, suite.cases, (testCase) =>
      agent.execute(testCase.input, { skills: testCase.skills }),
    );

    if (parsed.format === 'json') {
      allResults.push({ suite: suite.name, result });
    } else {
      console.log(formatSuiteReport(result));
      console.log();
    }

    totalPassed += result.passedCount;
    totalCases += result.results.length;
  }

  if (parsed.format === 'json') {
    console.log(
      JSON.stringify({ suites: allResults, summary: { totalPassed, totalCases } }, null, 2),
    );
  } else {
    console.log(`Resumen global: ${totalPassed}/${totalCases} casos aprobados`);
    console.log();
    console.log(formatUsageSummary(globalCollector.summary()));
  }

  if (totalPassed < totalCases) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('Error ejecutando las evals:', error);
  process.exitCode = 1;
});
