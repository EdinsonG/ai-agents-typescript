import { describe, expect, it } from 'vitest';
import { LLMProviderError } from '@/core/errors.js';
import { LLMProvider } from '@/core/LLMProvider.js';
import { ObservabilityCollector } from '@/observability/collector.js';
import type { ChatMessage, LLMCallRecord, LLMProviderConfig } from '@/types/index.js';

class ScriptedProvider extends LLMProvider {
  protected override async attemptCompletion(): Promise<{
    content: string;
    usage: { promptTokens: number; completionTokens: number; totalTokens: number };
  }> {
    return {
      content: 'respuesta',
      usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
    };
  }
}

class FailingProvider extends LLMProvider {
  protected override async attemptCompletion(): Promise<never> {
    throw new LLMProviderError('api key inválida', 'auth', 401);
  }
}

const MESSAGES: ChatMessage[] = [{ role: 'user', content: 'hola' }];

function makeCollectorProvider(config: Partial<LLMProviderConfig> = {}) {
  const collector = new ObservabilityCollector();
  const provider = new ScriptedProvider({
    apiKey: 'key',
    model: 'llama-3.3-70b-versatile',
    agentName: 'TestAgent',
    collector,
    resilience: { baseDelayMs: 1, maxDelayMs: 2 },
    ...config,
  });
  return { collector, provider };
}

describe('ObservabilityCollector + LLMProvider', () => {
  it('registra llamadas exitosas con tokens, latencia y tipo', async () => {
    const { collector, provider } = makeCollectorProvider();

    await provider.generateCompletion(MESSAGES);
    await provider.generateCompletion(MESSAGES, {
      responseFormat: { type: 'json_schema', json_schema: { name: 'x', schema: {} } },
    });

    const records = collector.getRecords();
    expect(records).toHaveLength(2);

    const [first, second] = records;
    expect(first.kind).toBe('text');
    expect(first.ok).toBe(true);
    expect(first.agentName).toBe('TestAgent');
    expect(first.usage).toEqual({ promptTokens: 100, completionTokens: 50, totalTokens: 150 });
    expect(first.latencyMs).toBeGreaterThanOrEqual(0);
    expect(second.kind).toBe('structured');
  });

  it('registra fallos con errorKind y usage en cero', async () => {
    const collector = new ObservabilityCollector();
    const provider = new FailingProvider({
      apiKey: 'key',
      model: 'm',
      agentName: 'FailingAgent',
      collector,
    });

    await expect(provider.generateCompletion(MESSAGES)).rejects.toThrow();
    expect(collector.getRecords()).toHaveLength(1);

    const record = collector.getRecords()[0];
    expect(record.ok).toBe(false);
    expect(record.errorKind).toBe('auth');
    expect(record.usage.totalTokens).toBe(0);
  });

  it('sin agentName no registra nada (mocks y pruebas quedan silenciosos)', async () => {
    const collector = new ObservabilityCollector();
    const provider = new ScriptedProvider({ apiKey: 'key', model: 'm', collector });

    await provider.generateCompletion(MESSAGES);

    expect(collector.getRecords()).toHaveLength(0);
  });

  it('summary agrega por agente con costo estimado según tarifas', () => {
    const collector = new ObservabilityCollector();
    const record = (
      agentName: string,
      promptTokens: number,
      completionTokens: number,
    ): LLMCallRecord => ({
      timestamp: new Date().toISOString(),
      agentName,
      model: 'llama-3.3-70b-versatile',
      kind: 'text',
      ok: true,
      latencyMs: 100,
      usage: { promptTokens, completionTokens, totalTokens: promptTokens + completionTokens },
    });

    collector.record(record('PO', 1_000_000, 1_000_000));
    collector.record(record('React', 500_000, 0));
    collector.record(record('React', 0, 2_000_000));

    const summary = collector.summary();

    expect(summary.totalCalls).toBe(3);
    expect(summary.okCalls).toBe(3);
    expect(summary.failedCalls).toBe(0);
    expect(summary.totalTokens).toBe(4_500_000);

    // PO: 1M in * 0.59 + 1M out * 0.79 = 1.38
    // React: 0.5M in * 0.59 + 2M out * 0.79 = 1.875
    expect(summary.estimatedCostUsd).toBeCloseTo(3.255, 3);
    expect(summary.byAgent[0].agentName).toBe('React');
    expect(summary.byAgent[0].totalTokens).toBe(2_500_000);
    expect(summary.byAgent[0].estimatedCostUsd).toBeCloseTo(1.875, 3);
    expect(summary.byAgent[1].agentName).toBe('PO');
    expect(summary.byAgent[1].estimatedCostUsd).toBeCloseTo(1.38, 3);
    expect(summary.avgLatencyMs).toBe(100);
  });

  it('toJSONL emite un objeto JSON por línea', async () => {
    const { collector, provider } = makeCollectorProvider();

    await provider.generateCompletion(MESSAGES);
    await provider.generateCompletion(MESSAGES);

    const lines = collector.toJSONL().split('\n');
    expect(lines).toHaveLength(2);
    for (const line of lines) {
      const parsed = JSON.parse(line) as LLMCallRecord;
      expect(parsed.agentName).toBe('TestAgent');
      expect(parsed.usage.totalTokens).toBe(150);
    }
  });

  it('clear reinicia los registros', async () => {
    const { collector, provider } = makeCollectorProvider();

    await provider.generateCompletion(MESSAGES);
    collector.clear();

    expect(collector.summary().totalCalls).toBe(0);
  });
});

describe('tarifas configurables', () => {
  it('usa tarifas personalizadas cuando se proveen', () => {
    const collector = new ObservabilityCollector({ inputUsdPerMTok: 1, outputUsdPerMTok: 2 });
    collector.record({
      timestamp: new Date().toISOString(),
      agentName: 'X',
      model: 'm',
      kind: 'text',
      ok: true,
      latencyMs: 10,
      usage: { promptTokens: 1_000_000, completionTokens: 1_000_000, totalTokens: 2_000_000 },
    });

    expect(collector.summary().estimatedCostUsd).toBe(3);
  });
});
