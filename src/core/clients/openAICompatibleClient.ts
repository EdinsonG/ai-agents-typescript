import type { CompletionResult, InferenceClient, InferenceRequest } from '@/types/index.js';
import { ProviderHttpError } from './httpError.js';

export interface OpenAICompatibleConfig {
  apiKey: string;
  /** Endpoint base SIN /chat/completions (ej. https://api.groq.com/openai/v1) */
  baseUrl: string;
  /** Timeout por intento en ms */
  timeoutMs: number;
}

/**
 * Adaptador para cualquier endpoint compatible con el protocolo OpenAI
 * (chat/completions): Groq, OpenAI, DeepSeek, Together, Mistral, Ollama,
 * LM Studio, vLLM, etc.
 *
 * Si el endpoint rechaza response_format json_schema (400), reintenta una
 * vez sin él: el modelo suele devolver JSON igualmente por instrucción del
 * prompt y el parser tolerante del núcleo lo normaliza.
 */
export class OpenAICompatibleClient implements InferenceClient {
  constructor(private readonly config: OpenAICompatibleConfig) {}

  public async complete(request: InferenceRequest): Promise<CompletionResult> {
    const url = `${this.config.baseUrl}/chat/completions`;

    const body: Record<string, unknown> = {
      model: request.model,
      messages: request.messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
      temperature: request.temperature,
      max_tokens: request.maxTokens,
      ...(request.responseFormat ? { response_format: request.responseFormat } : {}),
    };

    let response = await this.post(url, body);

    if (response.status === 400 && request.responseFormat) {
      const { response_format: _omitted, ...bodyWithoutFormat } = body;
      response = await this.post(url, bodyWithoutFormat);
    }

    if (!response.ok) {
      throw ProviderHttpError.from(response.status, await response.text());
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
    };

    return {
      content: data.choices?.[0]?.message?.content ?? 'No response generated.',
      usage: {
        promptTokens: data.usage?.prompt_tokens ?? 0,
        completionTokens: data.usage?.completion_tokens ?? 0,
        totalTokens: data.usage?.total_tokens ?? 0,
      },
    };
  }

  private async post(url: string, body: Record<string, unknown>): Promise<Response> {
    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.config.timeoutMs),
    });
  }
}
