import type { Agent } from '@/core/Agent.js';
import type { LLMJudge } from '@/evals/judge.js';
import { computeScorePercent, toVerdictList } from '@/evals/scoring.js';
import type { CritiqueOptions, CritiqueResult } from '@/types/index.js';

const DEFAULT_THRESHOLD = 80;

/**
 * Autocrítica opt-in: genera con el agente, juzga la salida contra una rúbrica
 * con el LLMJudge y, si queda bajo el umbral, pide una revisión con feedback
 * de los veredictos. Devuelve siempre la mejor de las dos salidas.
 *
 * Costo: hasta 2 llamadas del agente + 2 del juez por ejecución.
 */
export class CritiqueRunner {
  constructor(private readonly judge: LLMJudge) {}

  public async run(
    agent: Pick<Agent, 'execute'>,
    input: string,
    options: CritiqueOptions,
  ): Promise<CritiqueResult> {
    const { rubric, threshold = DEFAULT_THRESHOLD, revise = true } = options;
    if (rubric.length === 0) {
      throw new Error('La rúbrica de autocrítica no puede estar vacía');
    }

    const initialOutput = await agent.execute(input, { skills: options.skills });
    const initialVerdicts = await this.judge.evaluate(input, initialOutput, rubric);
    const initialScore = computeScorePercent(rubric, initialVerdicts);

    if (initialScore >= threshold || !revise) {
      return {
        input,
        output: initialOutput,
        initialScore,
        finalScore: initialScore,
        revised: false,
        verdicts: toVerdictList(rubric, initialVerdicts),
      };
    }

    const revisedOutput = await agent.execute(
      buildRevisionPrompt(input, initialOutput, initialVerdicts),
      {
        skills: options.skills,
      },
    );
    const revisedVerdictsById = await this.judge.evaluate(input, revisedOutput, rubric);
    const revisedScore = computeScorePercent(rubric, revisedVerdictsById);

    const keepRevised = revisedScore >= initialScore;

    return {
      input,
      output: keepRevised ? revisedOutput : initialOutput,
      initialScore,
      finalScore: Math.max(initialScore, revisedScore),
      revised: true,
      verdicts: toVerdictList(rubric, keepRevised ? revisedVerdictsById : initialVerdicts),
    };
  }
}

function buildRevisionPrompt(
  originalInput: string,
  previousOutput: string,
  verdicts: Record<string, { score: 0 | 1 | 2; reason: string }>,
): string {
  const feedback = Object.entries(verdicts)
    .map(([id, verdict]) => `- ${id}: ${verdict.score}/2 — ${verdict.reason}`)
    .join('\n');

  return [
    'Tu respuesta anterior no alcanzó el estándar de calidad requerido. Evaluación por criterios:',
    feedback,
    '',
    'Reescribe la respuesta completa corrigiendo cada criterio con puntuación menor a 2, manteniendo lo que ya estaba bien.',
    '',
    `## TAREA ORIGINAL`,
    originalInput,
    '',
    '## TU RESPUESTA ANTERIOR',
    previousOutput,
  ].join('\n');
}
