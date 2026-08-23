import Groq from 'groq-sdk';
import { ChatMessage, JsonSchemaResponseFormat, LLMProviderConfig } from '@/types/index.js';
import { classifyProviderError, LLMProviderError } from './errors.js';

export interface GenerateCompletionOptions {
  /** Cuando se define, el proveedor fuerza una salida JSON conforme al esquema */
  responseFormat?: JsonSchemaResponseFormat;
}

export interface ResilienceOptions {
  /** Reintentos ante errores transitorios (429/408/5xx/red). Default: 3 */
  maxRetries?: number;
  /** Delay base del backoff exponencial en ms. Default: 500 */
  baseDelayMs?: number;
  /** Techo del delay en ms. Default: 8000 */
  maxDelayMs?: number;
  /** Timeout de cada intento en ms. Default: 60000 */
  timeoutMs?: number;
}

const DEFAULTS: Required<ResilienceOptions> = {
  maxRetries: 3,
  baseDelayMs: 500,
  maxDelayMs: 8_000,
  timeoutMs: 60_000,
};

export class LLMProvider {
  private groq: Groq;
  private model: string;
  private temperature: number;
  private maxTokens: number;
  private resilience: Required<ResilienceOptions>;

  constructor(config: LLMProviderConfig) {
    this.resilience = { ...DEFAULTS, ...config.resilience };

    // El SDK no reintenta por su cuenta: nuestra política es la única fuente de verdad
    this.groq = new Groq({
      apiKey: config.apiKey,
      timeout: this.resilience.timeoutMs,
      maxRetries: 0,
    });
    this.model = config.model;
    this.temperature = config.temperature ?? 0.2;
    this.maxTokens = config.maxTokens ?? 4096;
  }

  /**
   * Envía un historial completo de mensajes a la API de Groq.
   * Reintenta con backoff exponencial + jitter ante errores transitorios
   * y lanza LLMProviderError tipada cuando la causa no es recuperable.
   */
  public async generateCompletion(
    messages: ChatMessage[],
    options: GenerateCompletionOptions = {},
  ): Promise<string> {
    const { maxRetries, baseDelayMs, maxDelayMs } = this.resilience;

    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        return await this.attemptCompletion(messages, options);
      } catch (error) {
        const providerError =
          error instanceof LLMProviderError ? error : classifyProviderError(error);

        const isLastAttempt = attempt > maxRetries;
        if (!providerError.retryable || isLastAttempt) {
          console.error(`[LLMProvider Error]: (${providerError.kind}) ${providerError.message}`);
          throw providerError;
        }

        const delay = computeBackoffDelay(attempt, baseDelayMs, maxDelayMs);
        console.warn(
          `[LLMProvider] Intento ${attempt}/${maxRetries} falló (${providerError.kind}). Reintentando en ${delay}ms...`,
        );
        await sleep(delay);
      }
    }

    /* Inalcanzable: el bucle retorna o lanza */
    throw new LLMProviderError('Bucle de reintentos terminado inesperadamente', 'unknown');
  }

  /**
   * Un intento de inferencia contra la API. Protegido para permitir
   * simulación de fallos en pruebas mediante subclases.
   */
  protected async attemptCompletion(
    messages: ChatMessage[],
    options: GenerateCompletionOptions,
  ): Promise<string> {
    try {
      const response = await this.groq.chat.completions.create({
        model: this.model,
        messages: messages as any,
        temperature: this.temperature,
        max_tokens: this.maxTokens,
        ...(options.responseFormat ? { response_format: options.responseFormat } : {}),
      });

      return response.choices[0]?.message?.content || 'No response generated.';
    } catch (error) {
      throw classifyProviderError(error);
    }
  }
}

function computeBackoffDelay(attempt: number, baseDelayMs: number, maxDelayMs: number): number {
  const exponential = Math.min(maxDelayMs, baseDelayMs * 2 ** (attempt - 1));
  // Jitter aleatorio ±25% para evitar tormentas de reintentos sincronizadas
  const jitter = exponential * 0.25 * (Math.random() * 2 - 1);
  return Math.max(1, Math.round(exponential + jitter));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
