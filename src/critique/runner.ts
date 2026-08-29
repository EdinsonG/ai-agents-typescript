import type { Agent } from '@/core/Agent.js';
import { config } from '@/core/config.js';
import type { LLMJudge } from '@/evals/judge.js';
import { computeScorePercent, toVerdictList } from '@/evals/scoring.js';
import type { CritiqueOptions, CritiqueResult } from '@/types/index.js';

const DEFAULT_THRESHOLD = 80;

/**
 * Autocrítica opt-in: genera con el agente, juzga la salida contra una rúbrica
 * con el LLMJudge y, si queda bajo el umbral, revisa con feedback de los
 * veredictos. Soporta múltiples rondas de revisión (maxRevisions).
 * Devuelve siempre la mejor salida encontrada.
 *
 * Costo: hasta (1 + maxRevisions) llamadas del agente + (1 + maxRevisions) del juez.
 */
export class CritiqueRunner {
  constructor(private readonly judge: LLMJudge) {}

  public async run(
    agent: Pick<Agent, 'execute'>,
    input: string,
    options: CritiqueOptions,
  ): Promise<CritiqueResult> {
    const {
      rubric,
      threshold = DEFAULT_THRESHOLD,
      revise = true,
      maxRevisions = config.maxRevisions,
    } = options;
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
        revisionsDone: 0,
        revised: false,
        verdicts: toVerdictList(rubric, initialVerdicts),
      };
    }

    let bestOutput = initialOutput;
    let bestScore = initialScore;
    let bestVerdicts = initialVerdicts;
    let currentOutput = initialOutput;
    let revisionsDone = 0;

    for (let revision = 0; revision < maxRevisions; revision++) {
      revisionsDone++;

      const revisedOutput = await agent.execute(buildRevisionPrompt(input, currentOutput, rubric), {
        skills: options.skills,
      });
      const revisedVerdicts = await this.judge.evaluate(input, revisedOutput, rubric);
      const revisedScore = computeScorePercent(rubric, revisedVerdicts);

      if (revisedScore > bestScore) {
        bestOutput = revisedOutput;
        bestScore = revisedScore;
        bestVerdicts = revisedVerdicts;
      }

      currentOutput = revisedOutput;

      // Si ya alcanzó el umbral, no necesita más revisiones
      if (revisedScore >= threshold) break;
    }

    return {
      input,
      output: bestOutput,
      initialScore,
      finalScore: bestScore,
      revisionsDone,
      revised: true,
      verdicts: toVerdictList(rubric, bestVerdicts),
    };
  }
}

function buildRevisionPrompt(
  originalInput: string,
  previousOutput: string,
  rubric: { id: string; requirement: string }[],
): string {
  const criteriaList = rubric.map((c) => `- ${c.id}: ${c.requirement}`).join('\n');

  return [
    'Tu respuesta anterior no alcanzó el estándar de calidad requerido.',
    '',
    '## CRITERIOS QUE DEBES CUMPLIR',
    criteriaList,
    '',
    '## TU RESPUESTA ANTERIOR',
    previousOutput,
    '',
    '## TAREA ORIGINAL',
    originalInput,
    '',
    'Reescribe la respuesta completa cumpliendo todos los criterios, manteniendo lo que ya estaba bien.',
  ].join('\n');
}
