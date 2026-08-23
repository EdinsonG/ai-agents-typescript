import { z } from 'zod';
import { Agent } from '@/core/Agent.js';
import type { LLMProvider } from '@/core/LLMProvider.js';
import type { EvalRubricCriterion } from './types.js';

const VerdictSchema = z.object({
  verdicts: z
    .array(
      z.object({
        id: z.string().min(1),
        score: z.union([z.literal(0), z.literal(1), z.literal(2)]),
        reason: z.string().min(1),
      }),
    )
    .min(1),
});

const JUDGE_SYSTEM_PROMPT = `Eres un evaluador riguroso e imparcial de salidas producidas por agentes de IA.
Tu único trabajo es puntuar la salida contra los criterios entregados, sin reescribirla ni mejorarla.
Escala de puntuación por criterio:
- 0: no cumple el requisito.
- 1: lo cumple de forma parcial o superficial.
- 2: lo cumple de forma completa y con calidad experta.
Sé exigente: la ambigüedad no cuenta como cumplimiento. Juzga cada criterio de forma independiente.
Responde únicamente con el JSON del esquema solicitado.`;

export class LLMJudge {
  private readonly judgeAgent: JudgeAgent;

  constructor(apiKey: string, model?: string, provider?: LLMProvider) {
    this.judgeAgent = new JudgeAgent(apiKey, model, provider);
  }

  /**
   * Evalúa una salida contra la rúbrica y devuelve un veredicto por criterio.
   * Si el juez omite algún criterio, ese criterio puntúa 0.
   */
  public async evaluate(
    taskInput: string,
    producedOutput: string,
    criteria: EvalRubricCriterion[],
  ): Promise<Record<string, { score: 0 | 1 | 2; reason: string }>> {
    const verdicts = await this.judgeAgent.judge(
      buildJudgePrompt(taskInput, producedOutput, criteria),
      VerdictSchema,
    );

    const byId = new Map(verdicts.verdicts.map((verdict) => [verdict.id, verdict]));
    const result: Record<string, { score: 0 | 1 | 2; reason: string }> = {};

    for (const criterion of criteria) {
      const verdict = byId.get(criterion.id);
      result[criterion.id] = verdict
        ? { score: verdict.score, reason: verdict.reason }
        : { score: 0, reason: 'El juez no evaluó este criterio.' };
    }

    return result;
  }
}

class JudgeAgent extends Agent {
  constructor(apiKey: string, model?: string, provider?: LLMProvider) {
    super(
      {
        name: 'LLM Judge',
        systemPrompt: JUDGE_SYSTEM_PROMPT,
        apiKey,
        model,
        temperature: 0,
      },
      provider,
    );
  }

  public async judge<T>(prompt: string, schema: z.ZodType<T>): Promise<T> {
    this.clearMemory();
    return this.executeStructured(prompt, schema);
  }
}

function buildJudgePrompt(
  taskInput: string,
  producedOutput: string,
  criteria: EvalRubricCriterion[],
): string {
  const MAX_OUTPUT_CHARS = 8_000;
  const output =
    producedOutput.length > MAX_OUTPUT_CHARS
      ? `${producedOutput.slice(0, MAX_OUTPUT_CHARS)}\n[...salida truncada para evaluación...]`
      : producedOutput;

  const criteriaList = criteria
    .map((criterion) => `- id: "${criterion.id}" → ${criterion.requirement}`)
    .join('\n');

  return [
    '## TAREA ORIGINAL',
    taskInput,
    '',
    '## SALIDA PRODUCIDA (a evaluar)',
    output,
    '',
    '## CRITERIOS DE EVALUACIÓN',
    criteriaList,
    '',
    'Evalúa cada criterio con score 0, 1 o 2 y justifica brevemente en español.',
  ].join('\n');
}
