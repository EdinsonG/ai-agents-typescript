import { LLMProvider } from '@/core/LLMProvider.js';
import type {
  ChatMessage,
  GenerateCompletionOptions,
  JsonSchemaResponseFormat,
} from '@/types/index.js';

export interface ScriptedRequest {
  messages: ChatMessage[];
  responseFormat?: JsonSchemaResponseFormat;
}

export interface ScriptedProviderOptions {
  /** Campo alternativo para el nombre del array de requests grabados */
  requestField?: 'messages' | 'calls' | 'requests';
  /** Captura responseFormat en cada request (default: true si se provee) */
  captureResponseFormat?: boolean;
}

/**
 * Crea un provider mock que retorna respuestas secuenciales de un array.
 * Graba cada request para aserciones en tests.
 *
 * @example
 * const provider = createScriptedProvider(['respuesta 1', 'respuesta 2']);
 * expect(provider.requests).toHaveLength(0);
 * await provider.generateCompletion([{ role: 'user', content: 'hola' }]);
 * expect(provider.requests).toHaveLength(1);
 */
export function createScriptedProvider(
  responses: string[],
  opts: ScriptedProviderOptions = {},
): LLMProvider & { requests: ScriptedRequest[] } {
  const { captureResponseFormat = true } = opts;

  class Scripted extends LLMProvider {
    public requests: ScriptedRequest[] = [];

    constructor() {
      super({ apiKey: 'key', model: 'mock' });
    }

    public override async generateCompletion(
      messages: ChatMessage[],
      options: GenerateCompletionOptions = {},
    ): Promise<string> {
      this.requests.push({
        messages: structuredClone(messages),
        ...(captureResponseFormat ? { responseFormat: options.responseFormat } : {}),
      });
      return responses[Math.min(this.requests.length - 1, responses.length - 1)];
    }
  }

  return new Scripted() as LLMProvider & { requests: ScriptedRequest[] };
}

export interface CapturingProviderOptions {
  /** String fijo a retornar en todas las llamadas */
  fixedResponse?: string;
  /** Captura el contenido del último mensaje user como string plano */
  captureLastUserContent?: boolean;
  /** Captura system y user messages como strings planos */
  captureSystemAndUser?: boolean;
}

export interface CapturingProviderResult {
  provider: LLMProvider;
  /** Requests grabados (messages arrays) */
  requests: ChatMessage[][];
  /** Si captureLastUserContent: último contenido user */
  lastUserContent?: string;
  /** Si captureSystemAndUser: contenido system */
  lastSystemMessage?: string;
  /** Si captureSystemAndUser: contenido user */
  lastUserMessage?: string;
}

/**
 * Crea un provider mock que retorna un string fijo y graba requests.
 *
 * @example
 * const { provider, requests } = createCapturingProvider();
 * await provider.generateCompletion([{ role: 'user', content: 'test' }]);
 * expect(requests).toHaveLength(1);
 *
 * @example
 * const { provider, lastSystemMessage, lastUserMessage } = createCapturingProvider({
 *   captureSystemAndUser: true,
 *   fixedResponse: '{"plan": true}',
 * });
 */
export function createCapturingProvider(
  opts: CapturingProviderOptions = {},
): CapturingProviderResult {
  const {
    fixedResponse = 'RESPUESTA_LIBRE',
    captureLastUserContent = false,
    captureSystemAndUser = false,
  } = opts;

  const result: CapturingProviderResult = {
    provider: undefined!,
    requests: [],
  };

  if (captureLastUserContent) {
    (result as any).lastUserContent = '';
  }
  if (captureSystemAndUser) {
    (result as any).lastSystemMessage = '';
    (result as any).lastUserMessage = '';
  }

  class Capturing extends LLMProvider {
    constructor() {
      super({ apiKey: 'key', model: 'mock' });
    }

    public override async generateCompletion(
      messages: ChatMessage[],
      _options?: GenerateCompletionOptions,
    ): Promise<string> {
      result.requests.push(structuredClone(messages));

      if (captureLastUserContent) {
        (result as any).lastUserContent = messages.at(-1)?.content ?? '';
      }
      if (captureSystemAndUser) {
        (result as any).lastSystemMessage = messages[0]?.content ?? '';
        (result as any).lastUserMessage = messages.at(-1)?.content ?? '';
      }

      return fixedResponse;
    }
  }

  result.provider = new Capturing();
  return result;
}
