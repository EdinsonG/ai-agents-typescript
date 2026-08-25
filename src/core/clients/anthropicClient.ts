import type { CompletionResult, InferenceClient, InferenceRequest } from '@/types/index.js';
import { ProviderHttpError } from './httpError.js';

export interface AnthropicClientConfig {
  apiKey: string;
  /** Endpoint base (default: https://api.anthropic.com/v1) */
  baseUrl: string;
  timeoutMs: number;
}

const ANTHROPIC_VERSION = '2023-06-01';

/**
 * Adaptador para la API de Mensajes de Anthropic (Claude).
 * Diferencias clave respecto al protocolo OpenAI:
 * - El system prompt va en un campo aparte.
 * - max_tokens es obligatorio.
 * - Usage reporta input_tokens/output_tokens.
 * - No existe json_schema nativo: la salida estructurada se fuerza por prompt.
 */
export class AnthropicClient implements InferenceClient {
  constructor(private readonly config: AnthropicClientConfig) {}

  public async complete(request: InferenceRequest): Promise<CompletionResult> {
    const url = `${this.config.baseUrl}/messages`;

    const systemParts = request.messages
      .filter((message) => message.role === 'system')
      .map((message) => message.content);
    if (request.responseFormat) {
      systemParts.push(this.jsonSchemaInstruction(request.responseFormat.json_schema.schema));
    }

    const body = {
      model: request.model,
      max_tokens: request.maxTokens,
      temperature: request.temperature,
      ...(systemParts.length > 0 ? { system: systemParts.join('\n\n') } : {}),
      messages: request.messages
        .filter((message) => message.role !== 'system')
        .map((message) => ({ role: message.role, content: message.content })),
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.config.timeoutMs),
    });

    if (!response.ok) {
      throw ProviderHttpError.from(response.status, await response.text());
    }

    const data = (await response.json()) as {
      content?: Array<{ type: string; text?: string }>;
      usage?: { input_tokens?: number; output_tokens?: number };
    };

    const content = (data.content ?? [])
      .filter((block) => block.type === 'text')
      .map((block) => block.text ?? '')
      .join('')
      .trim();

    const promptTokens = data.usage?.input_tokens ?? 0;
    const completionTokens = data.usage?.output_tokens ?? 0;

    return {
      content: content || 'No response generated.',
      usage: {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
      },
    };
  }

  private jsonSchemaInstruction(schema: Record<string, unknown>): string {
    return [
      'INSTRUCCIÓN DE SALIDA OBLIGATORIA:',
      'Responde ÚNICAMENTE con un objeto JSON válido conforme a este esquema JSON Schema.',
      'Sin markdown, sin cercos de código, sin explicaciones adicionales.',
      `Esquema: ${JSON.stringify(schema)}`,
    ].join('\n');
  }
}
