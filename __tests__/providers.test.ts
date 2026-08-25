import { afterEach, describe, expect, it, vi } from 'vitest';
import { AnthropicClient } from '@/core/clients/anthropicClient.js';
import { createInferenceClient, KNOWN_BASE_URLS } from '@/core/clients/index.js';
import { OpenAICompatibleClient } from '@/core/clients/openAICompatibleClient.js';
import type { InferenceRequest } from '@/types/index.js';

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const BASE_REQUEST: InferenceRequest = {
  model: 'llama-3.3-70b-versatile',
  messages: [
    { role: 'system', content: 'SYSTEM_PROMPT' },
    { role: 'user', content: 'hola' },
  ],
  temperature: 0.2,
  maxTokens: 4096,
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('OpenAICompatibleClient', () => {
  it('envía Authorization, baseUrl correcto y mapea usage OpenAI', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(200, {
        choices: [{ message: { content: 'respuesta' } }],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const client = new OpenAICompatibleClient({
      apiKey: 'sk-test',
      baseUrl: KNOWN_BASE_URLS.groq,
      timeoutMs: 1000,
    });

    const result = await client.complete(BASE_REQUEST);

    expect(result.content).toBe('respuesta');
    expect(result.usage).toEqual({ promptTokens: 10, completionTokens: 5, totalTokens: 15 });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.groq.com/openai/v1/chat/completions');
    expect((init as RequestInit).headers).toMatchObject({ Authorization: 'Bearer sk-test' });
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.model).toBe('llama-3.3-70b-versatile');
    expect(body.max_tokens).toBe(4096);
    expect(body.messages).toHaveLength(2);
  });

  it('reintenta sin response_format si el endpoint rechaza json_schema con 400', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(400, { error: { message: 'response_format not supported' } }),
      )
      .mockResolvedValueOnce(
        jsonResponse(200, {
          choices: [{ message: { content: '{"ok":true}' } }],
          usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
        }),
      );
    vi.stubGlobal('fetch', fetchMock);

    const client = new OpenAICompatibleClient({
      apiKey: 'k',
      baseUrl: 'https://api.openai.com/v1',
      timeoutMs: 1000,
    });

    const result = await client.complete({
      ...BASE_REQUEST,
      responseFormat: { type: 'json_schema', json_schema: { name: 'x', schema: {} } },
    });

    expect(result.content).toBe('{"ok":true}');
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const secondBody = JSON.parse((fetchMock.mock.calls[1][1] as RequestInit).body as string);
    expect(secondBody.response_format).toBeUndefined();
  });

  it('propaga el status HTTP en errores para la clasificación tipada', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(429, { error: 'rate limited' })));

    const client = new OpenAICompatibleClient({
      apiKey: 'k',
      baseUrl: KNOWN_BASE_URLS.groq,
      timeoutMs: 1000,
    });

    await expect(client.complete(BASE_REQUEST)).rejects.toMatchObject({ status: 429 });
  });
});

describe('AnthropicClient', () => {
  it('separa el system, exige max_tokens y mapea usage Anthropic', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(200, {
        content: [{ type: 'text', text: 'respuesta claude' }],
        usage: { input_tokens: 12, output_tokens: 7 },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const client = new AnthropicClient({
      apiKey: 'ak-test',
      baseUrl: KNOWN_BASE_URLS.anthropic,
      timeoutMs: 1000,
    });

    const result = await client.complete(BASE_REQUEST);

    expect(result.content).toBe('respuesta claude');
    expect(result.usage).toEqual({ promptTokens: 12, completionTokens: 7, totalTokens: 19 });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.anthropic.com/v1/messages');
    expect((init as RequestInit).headers).toMatchObject({
      'x-api-key': 'ak-test',
      'anthropic-version': '2023-06-01',
    });
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.system).toContain('SYSTEM_PROMPT');
    expect(body.max_tokens).toBe(4096);
    expect(body.messages).toEqual([{ role: 'user', content: 'hola' }]);
  });

  it('fuerza JSON por prompt cuando se pide salida estructurada', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(200, {
          content: [{ type: 'text', text: '{"a":1}' }],
          usage: { input_tokens: 1, output_tokens: 1 },
        }),
      ),
    );

    const client = new AnthropicClient({
      apiKey: 'k',
      baseUrl: KNOWN_BASE_URLS.anthropic,
      timeoutMs: 1000,
    });
    await client.complete({
      ...BASE_REQUEST,
      responseFormat: {
        type: 'json_schema',
        json_schema: { name: 'x', schema: { type: 'object' } },
      },
    });

    const body = JSON.parse((vi.mocked(fetch).mock.calls[0][1] as RequestInit).body as string);
    expect(body.system).toContain('JSON Schema');
    expect(body.system).toContain('"type":"object"');
  });
});

describe('createInferenceClient', () => {
  it('openai-compatible sin baseUrl usa Groq (comportamiento histórico)', () => {
    const client = createInferenceClient({
      provider: 'openai-compatible',
      apiKey: 'k',
      timeoutMs: 1000,
    });
    expect(client).toBeInstanceOf(OpenAICompatibleClient);
  });

  it('anthropic produce el adaptador de Anthropic', () => {
    const client = createInferenceClient({ provider: 'anthropic', apiKey: 'k', timeoutMs: 1000 });
    expect(client).toBeInstanceOf(AnthropicClient);
  });

  it('expone endpoints conocidos para configuración rápida', () => {
    expect(KNOWN_BASE_URLS.groq).toContain('groq.com');
    expect(KNOWN_BASE_URLS.ollama).toContain('localhost');
  });
});
