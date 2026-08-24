import { describe, expect, it } from 'vitest';
import { Agent } from '@/core/Agent.js';
import {
  classifyProviderError,
  extractStatusCode,
  isRetryableKind,
  LLMProviderError,
} from '@/core/errors.js';
import { LLMProvider } from '@/core/LLMProvider.js';
import { estimateMessagesTokens, truncateMessages } from '@/core/tokens.js';
import type { ChatMessage, ResilienceOptions } from '@/types/index.js';

function errorWithStatus(status: number): unknown {
  return Object.assign(new Error(`HTTP ${status}`), { status });
}

describe('clasificación de errores del proveedor', () => {
  it('extrae el código HTTP de errores arbitrarios', () => {
    expect(extractStatusCode(errorWithStatus(429))).toBe(429);
    expect(extractStatusCode(new Error('sin status'))).toBeUndefined();
    expect(extractStatusCode(null)).toBeUndefined();
  });

  it.each([
    [429, 'rate_limit', true],
    [408, 'timeout', true],
    [500, 'server', true],
    [503, 'server', true],
    [400, 'bad_request', false],
    [401, 'auth', false],
    [403, 'auth', false],
    [418, 'unknown', false],
  ] as const)('HTTP %i → kind=%s, retryable=%s', (status, kind, retryable) => {
    const classified = classifyProviderError(errorWithStatus(status));
    expect(classified.kind).toBe(kind);
    expect(classified.retryable).toBe(retryable);
    expect(classified.statusCode).toBe(status);
  });

  it('errores sin status se clasifican como red (reintentables) o timeout', () => {
    expect(classifyProviderError(new Error('socket hang up')).kind).toBe('network');
    expect(isRetryableKind('network')).toBe(true);

    const timeout = classifyProviderError(new Error('Request timed out'));
    expect(timeout.kind).toBe('timeout');
    expect(timeout.retryable).toBe(true);
  });
});

class FlakyProvider extends LLMProvider {
  public calls = 0;

  constructor(
    private readonly failures: LLMProviderError[],
    resilience?: ResilienceOptions,
  ) {
    super({ apiKey: 'key', model: 'mock', resilience });
  }

  protected override async attemptCompletion(): Promise<{
    content: string;
    usage: { promptTokens: number; completionTokens: number; totalTokens: number };
  }> {
    this.calls++;
    if (this.calls <= this.failures.length) {
      throw this.failures[this.calls - 1];
    }
    return {
      content: 'OK',
      usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
    };
  }
}

const FAST_RESILIENCE = { maxRetries: 3, baseDelayMs: 1, maxDelayMs: 2 };

describe('LLMProvider: política de reintentos', () => {
  it('reintenta errores transitorios y tiene éxito', async () => {
    const provider = new FlakyProvider(
      [
        new LLMProviderError('demasiadas peticiones', 'rate_limit', 429),
        new LLMProviderError('gateaway', 'server', 502),
      ],
      FAST_RESILIENCE,
    );

    await expect(provider.generateCompletion([{ role: 'user', content: 'hola' }])).resolves.toBe(
      'OK',
    );
    expect(provider.calls).toBe(3);
  });

  it('no reintenta errores no recuperables como auth', async () => {
    const provider = new FlakyProvider(
      [new LLMProviderError('api key inválida', 'auth', 401)],
      FAST_RESILIENCE,
    );

    const error = await provider
      .generateCompletion([{ role: 'user', content: 'hola' }])
      .catch((e) => e);

    expect(error).toBeInstanceOf(LLMProviderError);
    expect(error.kind).toBe('auth');
    expect(provider.calls).toBe(1);
  });

  it('agota los reintentos ante fallos persistentes y lanza la última causa', async () => {
    const provider = new FlakyProvider(
      [
        new LLMProviderError('f1', 'server', 500),
        new LLMProviderError('f2', 'server', 500),
        new LLMProviderError('f3', 'server', 500),
        new LLMProviderError('f4', 'server', 500),
      ],
      { ...FAST_RESILIENCE, maxRetries: 2 },
    );

    const error = await provider
      .generateCompletion([{ role: 'user', content: 'hola' }])
      .catch((e) => e);

    expect(provider.calls).toBe(3); // intento inicial + 2 reintentos
    expect(error.message).toContain('f3');
  });
});

describe('truncateMessages', () => {
  const systemMessage: ChatMessage = { role: 'system', content: 'SYS' };
  const bigContent = 'x'.repeat(400); // ~100 tokens

  function conversation(count: number): ChatMessage[] {
    return Array.from({ length: count }, (_, i) => ({
      role: i % 2 === 0 ? ('user' as const) : ('assistant' as const),
      content: `mensaje ${i} ${bigContent}`,
    }));
  }

  it('devuelve los mensajes intactos si caben en el presupuesto', () => {
    const messages = [systemMessage, ...conversation(3)];
    const result = truncateMessages(messages, 10_000);

    expect(result.map((m) => m.content)).toEqual(messages.map((m) => m.content));
  });

  it('conserva el system, descarta los más antiguos y nunca el último', () => {
    const messages = [systemMessage, ...conversation(6)];
    const result = truncateMessages(messages, 250);

    expect(result[0].content).toBe('SYS');
    expect(result.at(-1)?.role).toBe('assistant');
    expect(result.at(-1)?.content).toContain('mensaje 5');

    const marker = result.find((m) => m.role === 'system' && m.content.includes('omitidos'));
    expect(marker).toBeDefined();
    expect(marker?.content).toMatch(/omiti[dt]os por límite/);

    expect(estimateMessagesTokens(result)).toBeLessThanOrEqual(250 + 32);
  });

  it('mantiene intacto el historial original (copia defensiva)', () => {
    const messages = [systemMessage, ...conversation(4)];
    truncateMessages(messages, 200);

    expect(messages).toHaveLength(5);
    expect(messages[1].content).toContain('mensaje 0');
  });
});

class TinyContextAgent extends Agent {
  public sentMessages: ChatMessage[][] = [];

  constructor(maxContextTokens: number, responses: string[]) {
    super({
      name: 'Tiny Agent',
      systemPrompt: 'SYSTEM_BASE',
      apiKey: 'key',
      model: 'mock',
      maxContextTokens,
    });
    this.provider = new RecordingProvider(responses, this.sentMessages);
  }

  public run(input: string) {
    return this.execute(input);
  }
}

class RecordingProvider extends LLMProvider {
  constructor(
    private readonly responses: string[],
    private readonly sink: ChatMessage[][],
  ) {
    super({ apiKey: 'key', model: 'mock' });
  }

  public override async generateCompletion(messages: ChatMessage[]): Promise<string> {
    this.sink.push(structuredClone(messages));
    return this.responses[Math.min(this.sink.length - 1, this.responses.length - 1)];
  }
}

describe('Agent: presupuesto de contexto', () => {
  it('trunca lo enviado sin mutar la memoria interna', async () => {
    const agent = new TinyContextAgent(120, ['ok']);

    await agent.run('primera pregunta con contenido largo '.repeat(10));
    for (let i = 0; i < 4; i++) {
      await agent.run(`pregunta adicional número ${i}`);
    }

    const sent = agent.sentMessages.at(-1)!;
    expect(sent[0].content).toBe('SYSTEM_BASE');

    const marker = sent.find((m) => m.content.includes('omitidos'));
    expect(marker).toBeDefined();

    expect(sent.at(-1)?.content).toContain('pregunta adicional número 3');

    // La memoria conserva todo: system + 5 user + 5 assistant
    expect(agent['chatHistory'].length).toBe(11);

    // Lo enviado siempre respeta el presupuesto aproximado
    expect(estimateMessagesTokens(sent)).toBeLessThanOrEqual(120 + 64);
  });

  it('respeta un presupuesto holgado enviando todo el historial', async () => {
    const agent = new TinyContextAgent(100_000, ['ok']);

    await agent.run('única pregunta');

    expect(agent.sentMessages[0]).toHaveLength(2);
    expect(agent.sentMessages[0].some((m) => m.content.includes('omitidos'))).toBe(false);
  });
});
