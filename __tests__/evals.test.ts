import { describe, expect, it } from 'vitest';
import { LLMProvider } from '@/core/LLMProvider.js';
import { LLMJudge } from '@/evals/judge.js';
import { formatSuiteReport } from '@/evals/reporter.js';
import { EvalRunner } from '@/evals/runner.js';
import type {
  ChatMessage,
  GenerateCompletionOptions,
  JsonSchemaResponseFormat,
} from '@/types/index.js';

class ScriptedProvider extends LLMProvider {
  public requests: {
    messages: ChatMessage[];
    responseFormat?: JsonSchemaResponseFormat;
  }[] = [];

  constructor(private readonly scripted: string[]) {
    super({ apiKey: 'key', model: 'mock' });
  }

  public override async generateCompletion(
    messages: ChatMessage[],
    options: GenerateCompletionOptions = {},
  ): Promise<string> {
    this.requests.push({
      messages: structuredClone(messages),
      responseFormat: options.responseFormat,
    });
    return this.scripted[Math.min(this.requests.length - 1, this.scripted.length - 1)];
  }
}

function verdictJson(entries: Array<[string, 0 | 1 | 2, string]>): string {
  return JSON.stringify({
    verdicts: entries.map(([id, score, reason]) => ({ id, score, reason })),
  });
}

const FULL_VERDICTS = verdictJson([
  ['criterio-a', 2, 'cumple plenamente'],
  ['criterio-b', 2, 'cumple plenamente'],
]);

describe('LLMJudge', () => {
  it('evalúa con formato estructurado y mapea veredictos por id', async () => {
    const provider = new ScriptedProvider([FULL_VERDICTS]);
    const judge = new LLMJudge('key', undefined, provider);

    const verdicts = await judge.evaluate('tarea de prueba', 'salida de prueba', [
      { id: 'criterio-a', requirement: 'debe cumplir A' },
      { id: 'criterio-b', requirement: 'debe cumplir B' },
    ]);

    expect(verdicts['criterio-a']).toEqual({ score: 2, reason: 'cumple plenamente' });
    expect(verdicts['criterio-b'].score).toBe(2);

    // El prompt del juez incluye tarea, salida y criterios
    const prompt = provider.requests[0].messages.at(-1)!.content;
    expect(prompt).toContain('tarea de prueba');
    expect(prompt).toContain('salida de prueba');
    expect(prompt).toContain('criterio-b');

    // Solicita salida estructurada al proveedor
    expect(provider.requests[0].responseFormat?.type).toBe('json_schema');
  });

  it('los criterios omitidos por el juez puntúan 0', async () => {
    const provider = new ScriptedProvider([verdictJson([['criterio-a', 1, 'parcial']])]);
    const judge = new LLMJudge('key', undefined, provider);

    const verdicts = await judge.evaluate('tarea', 'salida', [
      { id: 'criterio-a', requirement: 'A' },
      { id: 'criterio-faltante', requirement: 'F' },
    ]);

    expect(verdicts['criterio-a'].score).toBe(1);
    expect(verdicts['criterio-faltante']).toEqual({
      score: 0,
      reason: 'El juez no evaluó este criterio.',
    });
  });
});

function makeRunner(verdictEntries: Array<[string, 0 | 1 | 2, string]>): EvalRunner {
  return new EvalRunner(
    new LLMJudge('key', undefined, new ScriptedProvider([verdictJson(verdictEntries)])),
  );
}

describe('EvalRunner', () => {
  it('aprueba un caso que cumple rúbrica y checks deterministas', async () => {
    const runner = makeRunner([
      ['rubrica-1', 2, 'bien'],
      ['rubrica-2', 2, 'bien'],
    ]);

    const result = await runner.runCase(
      {
        id: 'caso-ok',
        input: 'entrada',
        threshold: 80,
        rubric: [
          { id: 'rubrica-1', requirement: 'R1' },
          { id: 'rubrica-2', requirement: 'R2' },
        ],
        deterministicChecks: [{ name: 'contiene hola', test: (output) => output.includes('hola') }],
      },
      async () => 'hola mundo',
    );

    expect(result.passed).toBe(true);
    expect(result.scorePercent).toBe(100);
    expect(result.failedChecks).toHaveLength(0);
  });

  it('reprueba si falla un check determinista aunque la puntuación sea alta', async () => {
    const runner = makeRunner([['r1', 2, 'bien']]);

    const result = await runner.runCase(
      {
        id: 'caso-check',
        input: 'entrada',
        rubric: [{ id: 'r1', requirement: 'R1' }],
        deterministicChecks: [{ name: 'contiene palabra clave', test: () => false }],
      },
      async () => 'sin la palabra',
    );

    expect(result.passed).toBe(false);
    expect(result.scorePercent).toBe(100);
    expect(result.failedChecks).toEqual(['contiene palabra clave']);
  });

  it('reprueba cuando la puntuación queda bajo el umbral', async () => {
    const runner = makeRunner([
      ['r1', 0, 'mal'],
      ['r2', 1, 'medio'],
    ]);

    const result = await runner.runCase(
      {
        id: 'caso-bajo',
        input: 'entrada',
        threshold: 70,
        rubric: [
          { id: 'r1', requirement: 'R1' },
          { id: 'r2', requirement: 'R2' },
        ],
      },
      async () => 'salida pobre',
    );

    expect(result.passed).toBe(false);
    expect(result.scorePercent).toBe(25);
  });

  it('agrega la suite con media y conteo de aprobados', async () => {
    const call = 0;
    const verdictsByCall = [verdictJson([['r', 2, 'bien']]), verdictJson([['r', 0, 'mal']])];

    const judge = new LLMJudge('key', undefined, new ScriptedProvider(verdictsByCall));
    const runner = new EvalRunner(judge);

    const suite = await runner.runSuite(
      'suite-demo',
      [
        { id: 'bueno', input: 'i1', rubric: [{ id: 'r', requirement: 'R' }] },
        { id: 'malo', input: 'i2', rubric: [{ id: 'r', requirement: 'R' }] },
      ],
      async () => {
        void call;
        return 'salida';
      },
    );

    expect(suite.name).toBe('suite-demo');
    expect(suite.averageScore).toBe(50);
    expect(suite.passedCount).toBe(1);
  });
});

describe('formatSuiteReport', () => {
  it('incluye casos, puntuaciones y resumen', async () => {
    const runner = makeRunner([['r', 2, 'excelente']]);
    const suite = await runner.runSuite(
      'reporte-demo',
      [{ id: 'caso-x', input: 'i', threshold: 60, rubric: [{ id: 'r', requirement: 'R' }] }],
      async () => 'salida',
    );

    const report = formatSuiteReport(suite);

    expect(report).toContain('reporte-demo');
    expect(report).toContain('caso-x');
    expect(report).toContain('100%');
    expect(report).toContain('1/1 casos aprobados');
    expect(report).toContain('r: 2/2');
  });
});
