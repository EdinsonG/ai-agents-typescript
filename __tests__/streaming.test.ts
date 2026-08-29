import { describe, it, expect } from 'vitest';
import { LLMProvider } from '@/core/LLMProvider.js';
import type { InferenceClient, InferenceRequest, CompletionResult, StreamChunk } from '@/types/index.js';

/** Fake client that supports streaming */
function createStreamingClient(chunks: string[]): InferenceClient {
  return {
    async complete(request: InferenceRequest): Promise<CompletionResult> {
      return {
        content: chunks.join(''),
        usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
      };
    },
    async *stream(request: InferenceRequest): AsyncGenerator<StreamChunk, void, unknown> {
      for (const chunk of chunks) {
        yield { delta: chunk };
      }
      yield {
        delta: '',
        usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
      };
    },
  };
}

/** Fake client WITHOUT streaming */
function createNonStreamingClient(): InferenceClient {
  return {
    async complete(): Promise<CompletionResult> {
      return {
        content: 'Full response',
        usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
      };
    },
  };
}

describe('LLMProvider streaming', () => {
  it('streams chunks from a streaming client', async () => {
    const provider = new LLMProvider({
      apiKey: 'test-key',
      model: 'test-model',
      client: createStreamingClient(['Hello', ' ', 'World']),
    });

    const chunks: string[] = [];
    for await (const chunk of provider.generateCompletionStream([{ role: 'user', content: 'hi' }])) {
      chunks.push(chunk.delta);
    }

    expect(chunks.join('')).toBe('Hello World');
  });

  it('falls back to regular completion when client has no stream()', async () => {
    const provider = new LLMProvider({
      apiKey: 'test-key',
      model: 'test-model',
      client: createNonStreamingClient(),
    });

    const chunks: string[] = [];
    for await (const chunk of provider.generateCompletionStream([{ role: 'user', content: 'hi' }])) {
      chunks.push(chunk.delta);
    }

    expect(chunks.join('')).toBe('Full response');
  });

  it('reports usage in final chunk', async () => {
    const provider = new LLMProvider({
      apiKey: 'test-key',
      model: 'test-model',
      client: createStreamingClient(['test']),
    });

    let lastChunk: StreamChunk | undefined;
    for await (const chunk of provider.generateCompletionStream([{ role: 'user', content: 'hi' }])) {
      lastChunk = chunk;
    }

    expect(lastChunk?.usage).toBeDefined();
    expect(lastChunk?.usage?.totalTokens).toBe(15);
  });
});
