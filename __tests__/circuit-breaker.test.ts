import { describe, expect, it } from 'vitest';
import { LLMProviderError } from '@/core/errors.js';
import { LLMProvider } from '@/core/LLMProvider.js';
import type { CompletionResult, InferenceClient } from '@/types/index.js';

function createFailingClient(kind: 'server' | 'rate_limit' | 'auth'): InferenceClient {
  const statusByKind = { server: 500, rate_limit: 429, auth: 401 };
  return {
    async complete(): Promise<CompletionResult> {
      // Throw a plain object with .status so classifyProviderError extracts it
      const err = new Error(`Simulated ${kind} error`);
      (err as any).status = statusByKind[kind];
      throw err;
    },
  };
}

describe('LLMProvider circuit breaker', () => {
  it('opens circuit after 3 consecutive retryable failures (maxRetries=0)', async () => {
    const client = createFailingClient('server');
    const provider = new LLMProvider({
      apiKey: 'test',
      model: 'test',
      client,
      resilience: { maxRetries: 0, baseDelayMs: 1, maxDelayMs: 1, timeoutMs: 10_000 },
    });

    // 3 failures should open the circuit
    for (let i = 0; i < 3; i++) {
      await expect(
        provider.generateCompletion([{ role: 'user', content: 'test' }]),
      ).rejects.toThrow('server error');
    }

    // 4th call should be blocked by circuit breaker (immediate throw, no LLM call)
    await expect(provider.generateCompletion([{ role: 'user', content: 'test' }])).rejects.toThrow(
      'Circuit breaker abierto',
    );
  });

  it('does not open circuit for auth errors (non-retryable)', async () => {
    const client = createFailingClient('auth');
    const provider = new LLMProvider({
      apiKey: 'test',
      model: 'test',
      client,
      resilience: { maxRetries: 0, baseDelayMs: 1, maxDelayMs: 1, timeoutMs: 10_000 },
    });

    // Auth errors should NOT count toward circuit breaker
    for (let i = 0; i < 5; i++) {
      await expect(
        provider.generateCompletion([{ role: 'user', content: 'test' }]),
      ).rejects.toThrow();
    }

    // Circuit should still be closed — verify by catching the error
    try {
      await provider.generateCompletion([{ role: 'user', content: 'test' }]);
      fail('Should have thrown');
    } catch (error) {
      // Error should be from the LLM (auth), NOT from circuit breaker
      expect((error as Error).message).not.toContain('Circuit breaker');
    }
  });

  it('rate_limit errors count toward circuit breaker', async () => {
    const client = createFailingClient('rate_limit');
    const provider = new LLMProvider({
      apiKey: 'test',
      model: 'test',
      client,
      resilience: { maxRetries: 0, baseDelayMs: 1, maxDelayMs: 1, timeoutMs: 10_000 },
    });

    for (let i = 0; i < 3; i++) {
      await expect(
        provider.generateCompletion([{ role: 'user', content: 'test' }]),
      ).rejects.toThrow();
    }

    // Circuit should be open
    await expect(provider.generateCompletion([{ role: 'user', content: 'test' }])).rejects.toThrow(
      'Circuit breaker abierto',
    );
  });

  it('circuit stays open and blocks requests immediately', async () => {
    let llmCallCount = 0;
    const client: InferenceClient = {
      async complete(): Promise<CompletionResult> {
        llmCallCount++;
        throw new LLMProviderError('server error', 'server');
      },
    };

    const provider = new LLMProvider({
      apiKey: 'test',
      model: 'test',
      client,
      resilience: { maxRetries: 0, baseDelayMs: 1, maxDelayMs: 1, timeoutMs: 10_000 },
    });

    // Open the circuit (3 failures)
    for (let i = 0; i < 3; i++) {
      await expect(
        provider.generateCompletion([{ role: 'user', content: 'test' }]),
      ).rejects.toThrow();
    }

    const callsAfterOpen = llmCallCount;

    // Next 5 calls should all be blocked by circuit breaker (no additional LLM calls)
    for (let i = 0; i < 5; i++) {
      await expect(
        provider.generateCompletion([{ role: 'user', content: 'test' }]),
      ).rejects.toThrow('Circuit breaker abierto');
    }

    // No additional LLM calls should have been made
    expect(llmCallCount).toBe(callsAfterOpen);
  });

  it('successful call resets failure counter', async () => {
    let callCount = 0;
    const client: InferenceClient = {
      async complete(): Promise<CompletionResult> {
        callCount++;
        // fail, fail, succeed, fail, fail → should NOT open circuit
        if (callCount === 1 || callCount === 2 || callCount === 4 || callCount === 5) {
          throw new LLMProviderError('server error', 'server');
        }
        return {
          content: 'ok',
          usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
        };
      },
    };

    const provider = new LLMProvider({
      apiKey: 'test',
      model: 'test',
      client,
      resilience: { maxRetries: 0, baseDelayMs: 1, maxDelayMs: 1, timeoutMs: 10_000 },
    });

    // calls 1-2: fail, call 3: success (resets counter)
    await expect(
      provider.generateCompletion([{ role: 'user', content: 'test' }]),
    ).rejects.toThrow();
    await expect(
      provider.generateCompletion([{ role: 'user', content: 'test' }]),
    ).rejects.toThrow();
    const result = await provider.generateCompletion([{ role: 'user', content: 'test' }]);
    expect(result).toBe('ok');

    // calls 4-5: fail again (counter starts from 0, now at 2)
    await expect(
      provider.generateCompletion([{ role: 'user', content: 'test' }]),
    ).rejects.toThrow();
    await expect(
      provider.generateCompletion([{ role: 'user', content: 'test' }]),
    ).rejects.toThrow();

    // call 6: should succeed (only 2 consecutive failures, circuit still closed)
    const result2 = await provider.generateCompletion([{ role: 'user', content: 'test' }]);
    expect(result2).toBe('ok');
  });
});
