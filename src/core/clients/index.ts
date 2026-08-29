import { getLogger } from '@/core/logger.js';
import type { InferenceClient, InferenceProviderKind } from '@/types/index.js';
import { AnthropicClient } from './anthropicClient.js';
import { OpenAICompatibleClient } from './openAICompatibleClient.js';

/** Endpoints base conocidos (protocolo OpenAI-compatible salvo Anthropic). */
export const KNOWN_BASE_URLS = {
  groq: 'https://api.groq.com/openai/v1',
  openai: 'https://api.openai.com/v1',
  deepseek: 'https://api.deepseek.com/v1',
  together: 'https://api.together.xyz/v1',
  mistral: 'https://api.mistral.ai/v1',
  ollama: 'http://localhost:11434/v1',
  anthropic: 'https://api.anthropic.com/v1',
} as const;

export interface CreateInferenceClientOptions {
  provider: InferenceProviderKind;
  apiKey: string;
  baseUrl?: string;
  timeoutMs: number;
}

/**
 * Fábrica de clientes de inferencia. Con 'openai-compatible' y sin baseUrl
 * se usa Groq (comportamiento histórico del proyecto).
 */
export function createInferenceClient(options: CreateInferenceClientOptions): InferenceClient {
  switch (options.provider) {
    case 'anthropic':
      return new AnthropicClient({
        apiKey: options.apiKey,
        baseUrl: options.baseUrl ?? KNOWN_BASE_URLS.anthropic,
        timeoutMs: options.timeoutMs,
      });
    default: {
      if (options.provider !== 'openai-compatible') {
        getLogger().warn(
          `[InferenceClient] Provider "${options.provider}" no reconocido. ` +
            `Usando OpenAI-compatible. Proveedores válidos: anthropic, openai-compatible.`,
        );
      }
      return new OpenAICompatibleClient({
        apiKey: options.apiKey,
        baseUrl: options.baseUrl ?? KNOWN_BASE_URLS.groq,
        timeoutMs: options.timeoutMs,
      });
    }
  }
}
