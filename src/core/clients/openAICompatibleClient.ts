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
      // Extraer Retry-After header para 429 (rate limit)
      const retryAfterMs = this.extractRetryAfter(response);
      throw ProviderHttpError.from(response.status, await response.text(), retryAfterMs);
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

  /**
   * Extrae el header Retry-After de una respuesta 429.
   * Soporta tanto segundos (número) como HTTP-date.
   */
  private extractRetryAfter(response: Response): number | undefined {
    const retryAfter = response.headers.get('retry-after');
    if (!retryAfter) return undefined;

    // Si es un número de segundos
    const seconds = Number(retryAfter);
    if (!Number.isNaN(seconds)) {
      return Math.min(seconds * 1000, 60_000); // Máximo 60 segundos
    }

    // Si es una fecha HTTP-date, calcular la diferencia
    const date = new Date(retryAfter);
    if (!Number.isNaN(date.getTime())) {
      const diffMs = date.getTime() - Date.now();
      return Math.min(Math.max(diffMs, 1000), 60_000); // Entre 1s y 60s
    }

    return undefined;
  }
}
