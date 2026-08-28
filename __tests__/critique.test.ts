import { describe, expect, it } from 'vitest';
import { Agent } from '@/core/Agent.js';
import { LLMProvider } from '@/core/LLMProvider.js';
import { CritiqueRunner } from '@/critique/runner.js';
import { LLMJudge } from '@/evals/judge.js';
import type { CritiqueOptions } from '@/types/index.js';

class QueuedProvider extends LLMProvider {
  public requests: string[] = [];

  constructor(private readonly responses: string[]) {
    super({ apiKey: 'key', model: 'mock' });
  }

  public override async generateCompletion(messages: { content: string }[]): Promise<string> {
    this.requests.push(messages.at(-1)?.content ?? '');
    return this.responses[Math.min(this.requests.length - 1, this.responses.length - 1)];
  }
}

class ScriptedAgent extends Agent {
  public provider: QueuedProvider;

  constructor(responses: string[]) {
    const queued = new QueuedProvider(responses);
    super({ name: 'Scripted Agent', systemPrompt: 'SYS', apiKey: 'key', model: 'mock' }, queued);
    this.provider = queued;
  }
}

const RUBRIC = [
  { id: 'criterio-a', requirement: 'Debe cumplir A' },
  { id: 'criterio-b', requirement: 'Debe cumplir B' },
];

function verdictJson(entries: Array<[string, 0 | 1 | 2, string]>): string {
  return JSON.stringify({
    verdicts: entries.map(([id, score, reason]) => ({ id, score, reason })),
  });
}

function makeRunner(judgeResponses: string[]): CritiqueRunner {
  return new CritiqueRunner(new LLMJudge('key', undefined, new QueuedProvider(judgeResponses)));
}

const OPTIONS: CritiqueOptions = { rubric: RUBRIC, threshold: 80 };

describe('CritiqueRunner', () => {
  it('no revisa cuando la puntuación alcanza el umbral', async () => {
    const agent = new ScriptedAgent(['salida buena']);
    const runner = makeRunner([
      verdictJson([
        ['criterio-a', 2, 'bien'],
        ['criterio-b', 2, 'bien'],
      ]),
    ]);

    const result = await runner.run(agent, 'tarea', OPTIONS);

    expect(result.revised).toBe(false);
    expect(result.output).toBe('salida buena');
    expect(result.initialScore).toBe(100);
    expect(result.finalScore).toBe(100);
    expect(agent.provider.requests).toHaveLength(1);
  });

  it('revisa con feedback cuando queda bajo el umbral y mejora la puntuación', async () => {
    const agent = new ScriptedAgent(['salida débil', 'salida corregida']);
    const runner = makeRunner([
      verdictJson([
        ['criterio-a', 2, 'bien'],
        ['criterio-b', 0, 'falta detalle técnico'],
      ]),
      verdictJson([
        ['criterio-a', 2, 'bien'],
        ['criterio-b', 2, 'ahora completo'],
      ]),
    ]);

    const result = await runner.run(agent, 'tarea', OPTIONS);

    expect(result.revised).toBe(true);
    expect(result.initialScore).toBe(50);
    expect(result.finalScore).toBe(100);
    expect(result.output).toBe('salida corregida');
    expect(agent.provider.requests).toHaveLength(2);

    const revisionPrompt = agent.provider.requests[1];
    expect(revisionPrompt).toContain('no alcanzó el estándar');
    expect(revisionPrompt).toContain('CRITERIOS QUE DEBES CUMPLIR');
    expect(revisionPrompt).toContain('criterio-a');
    expect(revisionPrompt).toContain('criterio-b');
    expect(revisionPrompt).toContain('tarea');
  });

  it('con revise:false devuelve la salida inicial aunque esté bajo el umbral', async () => {
    const agent = new ScriptedAgent(['salida débil']);
    const runner = makeRunner([
      verdictJson([
        ['criterio-a', 0, 'mal'],
        ['criterio-b', 0, 'mal'],
      ]),
    ]);

    const result = await runner.run(agent, 'tarea', { ...OPTIONS, revise: false });

    expect(result.revised).toBe(false);
    expect(result.output).toBe('salida débil');
    expect(result.finalScore).toBe(0);
    expect(agent.provider.requests).toHaveLength(1);
  });

  it('conserva la mejor salida si la revisión puntúa peor (ruido del juez)', async () => {
    const agent = new ScriptedAgent(['salida original', 'salida empeorada']);
    const runner = makeRunner([
      verdictJson([
        ['criterio-a', 1, 'parcial'],
        ['criterio-b', 1, 'parcial'],
      ]),
      verdictJson([
        ['criterio-a', 0, 'peor'],
        ['criterio-b', 0, 'peor'],
      ]),
    ]);

    const result = await runner.run(agent, 'tarea', OPTIONS);

    expect(result.revised).toBe(true);
    expect(result.output).toBe('salida original');
    expect(result.initialScore).toBe(50);
    expect(result.finalScore).toBe(50);
  });

  it('rechaza rúbricas vacías', async () => {
    const agent = new ScriptedAgent(['x']);
    const runner = makeRunner([]);

    await expect(runner.run(agent, 'tarea', { rubric: [] })).rejects.toThrow(
      /no puede estar vacía/,
    );
  });
});
