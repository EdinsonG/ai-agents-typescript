import { afterEach, describe, expect, it, vi } from 'vitest';
import { OpenAICompatibleClient } from '@/core/clients/openAICompatibleClient.js';
import type { InferenceRequest } from '@/types/index.js';

/** Creates a mock Response that streams SSE data */
function createMockStreamResponse(sseData: string[], status = 200): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      for (const line of sseData) {
        controller.enqueue(encoder.encode(`${line}\n`));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    status,
    headers: { 'Content-Type': 'text/event-stream' },
  });
}

const DEFAULT_REQUEST: InferenceRequest = {
  model: 'test-model',
  messages: [{ role: 'user', content: 'Hello' }],
  temperature: 0.7,
  maxTokens: 100,
};

describe('OpenAICompatibleClient.stream()', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('yields delta chunks from SSE stream', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(
        createMockStreamResponse([
          'data: {"choices":[{"delta":{"content":"Hello"}}]}',
          'data: {"choices":[{"delta":{"content":" world"}}]}',
          'data: {"choices":[{"delta":{"content":"!"}}]}',
          'data: [DONE]',
        ]),
      );

    const client = new OpenAICompatibleClient({
      apiKey: 'test-key',
      baseUrl: 'https://api.test.com/v1',
      timeoutMs: 10_000,
    });

    const chunks: string[] = [];
    for await (const chunk of client.stream(DEFAULT_REQUEST)) {
      if (chunk.delta) chunks.push(chunk.delta);
    }

    expect(chunks).toEqual(['Hello', ' world', '!']);
  });

  it('includes usage in final chunk when available', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(
        createMockStreamResponse([
          'data: {"choices":[{"delta":{"content":"Hi"}}]}',
          'data: {"usage":{"prompt_tokens":10,"completion_tokens":5,"total_tokens":15},"choices":[]}',
          'data: [DONE]',
        ]),
      );

    const client = new OpenAICompatibleClient({
      apiKey: 'test-key',
      baseUrl: 'https://api.test.com/v1',
      timeoutMs: 10_000,
    });

    const chunks: Array<{
      delta: string;
      usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
    }> = [];
    for await (const chunk of client.stream(DEFAULT_REQUEST)) {
      chunks.push(chunk);
    }

    expect(chunks[0].delta).toBe('Hi');
    const lastChunk = chunks[chunks.length - 1];
    expect(lastChunk.usage).toBeDefined();
    expect(lastChunk.usage?.promptTokens).toBe(10);
    expect(lastChunk.usage?.completionTokens).toBe(5);
  });

  it('skips malformed SSE lines gracefully', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(
        createMockStreamResponse([
          'data: {"choices":[{"delta":{"content":"Valid"}}]}',
          'data: not-valid-json',
          'data: {"choices":[{"delta":{"content":"Also valid"}}]}',
          'data: [DONE]',
        ]),
      );

    const client = new OpenAICompatibleClient({
      apiKey: 'test-key',
      baseUrl: 'https://api.test.com/v1',
      timeoutMs: 10_000,
    });

    const chunks: string[] = [];
    for await (const chunk of client.stream(DEFAULT_REQUEST)) {
      if (chunk.delta) chunks.push(chunk.delta);
    }

    expect(chunks).toEqual(['Valid', 'Also valid']);
  });

  it('handles lines without data: prefix', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(
        createMockStreamResponse([
          ': heartbeat',
          'data: {"choices":[{"delta":{"content":"After comment"}}]}',
          'data: [DONE]',
        ]),
      );

    const client = new OpenAICompatibleClient({
      apiKey: 'test-key',
      baseUrl: 'https://api.test.com/v1',
      timeoutMs: 10_000,
    });

    const chunks: string[] = [];
    for await (const chunk of client.stream(DEFAULT_REQUEST)) {
      if (chunk.delta) chunks.push(chunk.delta);
    }

    expect(chunks).toEqual(['After comment']);
  });

  it('throws on non-OK response', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(
        new Response('Rate limited', { status: 429, headers: { 'retry-after': '2' } }),
      );

    const client = new OpenAICompatibleClient({
      apiKey: 'test-key',
      baseUrl: 'https://api.test.com/v1',
      timeoutMs: 10_000,
    });

    const gen = client.stream(DEFAULT_REQUEST);
    await expect(gen.next()).rejects.toThrow();
  });

  it('handles empty stream (no data lines)', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(createMockStreamResponse(['data: [DONE]']));

    const client = new OpenAICompatibleClient({
      apiKey: 'test-key',
      baseUrl: 'https://api.test.com/v1',
      timeoutMs: 10_000,
    });

    const chunks: string[] = [];
    for await (const chunk of client.stream(DEFAULT_REQUEST)) {
      if (chunk.delta) chunks.push(chunk.delta);
    }

    expect(chunks).toEqual([]);
  });

  it('sends correct request body with stream: true', async () => {
    const fetchSpy = vi
      .fn()
      .mockResolvedValue(
        createMockStreamResponse([
          'data: {"choices":[{"delta":{"content":"ok"}}]}',
          'data: [DONE]',
        ]),
      );
    globalThis.fetch = fetchSpy;

    const client = new OpenAICompatibleClient({
      apiKey: 'test-key',
      baseUrl: 'https://api.test.com/v1',
      timeoutMs: 10_000,
    });

    for await (const _ of client.stream(DEFAULT_REQUEST)) {
      // consume
    }

    const [, options] = fetchSpy.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.stream).toBe(true);
    expect(body.model).toBe('test-model');
    expect(body.messages).toHaveLength(1);
  });
});
