import Groq from 'groq-sdk';
import { globalCollector } from '@/observability/collector.js';
import type {
  ChatMessage,
  GenerateCompletionOptions,
  LLMCallRecord,
  LLMErrorKind,
  LLMProviderConfig,
  ResilienceOptions,
  TokenUsage,
} from '@/types/index.js';
import { classifyProviderError, LLMProviderError } from './errors.js';

const DEFAULTS: Required<ResilienceOptions> = {
  maxRetries: 3,
  baseDelayMs: 500,
  maxDelayMs: 8_000,
  timeoutMs: 60_000,
};

const ZERO_USAGE: TokenUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

/** Resultado interno de un intento de inferencia. */
export interface CompletionResult {
  content: string;
  usage: TokenUsage;
}

export class LLMProvider {
  private groq: Groq;
  private model: string;
  private temperature: number;
  private maxTokens: number;
  private resilience: Required<ResilienceOptions>;
  private agentName?: string;
  private collector: { record: (record: LLMCallRecord) => void } | undefined;

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
    this.agentName = config.agentName;
    this.collector = config.collector ?? (config.agentName ? globalCollector : undefined);
  }

  /**
   * Envía un historial completo de mensajes a la API de Groq.
   * Reintenta con backoff exponencial + jitter ante errores transitorios,
   * lanza LLMProviderError tipada cuando la causa no es recuperable
   * y registra consumo/latencia en el collector configurado.
   */
  public async generateCompletion(
    messages: ChatMessage[],
    options: GenerateCompletionOptions = {},
  ): Promise<string> {
    const { maxRetries, baseDelayMs, maxDelayMs } = this.resilience;
    const kind = options.responseFormat ? 'structured' : 'text';

    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      const startedAt = Date.now();
      try {
        const result = await this.attemptCompletion(messages, options);
        this.record(kind, true, Date.now() - startedAt, result.usage);
        return result.content;
      } catch (error) {
        const providerError =
          error instanceof LLMProviderError ? error : classifyProviderError(error);
        this.record(kind, false, Date.now() - startedAt, ZERO_USAGE, providerError.kind);

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
  ): Promise<CompletionResult> {
    try {
      const response = await this.groq.chat.completions.create({
        model: this.model,
        messages: messages as any,
        temperature: this.temperature,
        max_tokens: this.maxTokens,
        ...(options.responseFormat ? { response_format: options.responseFormat } : {}),
      });

      const usage = response.usage;
      return {
        content: response.choices[0]?.message?.content || 'No response generated.',
        usage: {
          promptTokens: usage?.prompt_tokens ?? 0,
          completionTokens: usage?.completion_tokens ?? 0,
          totalTokens: usage?.total_tokens ?? 0,
        },
      };
    } catch (error) {
      throw classifyProviderError(error);
    }
  }

  private record(
    kind: 'text' | 'structured',
    ok: boolean,
    latencyMs: number,
    usage: TokenUsage,
    errorKind?: LLMErrorKind,
  ): void {
    if (!this.collector || !this.agentName) return;

    const record: LLMCallRecord = {
      timestamp: new Date().toISOString(),
      agentName: this.agentName,
      model: this.model,
      kind,
      ok,
      latencyMs,
      usage,
      ...(errorKind ? { errorKind } : {}),
    };
    this.collector.record(record);
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
