import { globalCollector } from '@/observability/collector.js';
import type {
  ChatMessage,
  CompletionResult,
  GenerateCompletionOptions,
  InferenceClient,
  LLMCallRecord,
  LLMErrorKind,
  LLMProviderConfig,
  ResilienceOptions,
  TokenUsage,
} from '@/types/index.js';
import { createInferenceClient } from './clients/index.js';
import { config } from './config.js';
import { classifyProviderError, LLMProviderError } from './errors.js';

const ZERO_USAGE: TokenUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

/** Número de fallos consecutivos antes de abrir el circuito. */
const CIRCUIT_BREAKER_THRESHOLD = 3;
/** Tiempo en ms que el circuito permanece abierto antes de intentar de nuevo. */
const CIRCUIT_BREAKER_COOLDOWN_MS = 30_000;

/** Estados del circuit breaker. */
type CircuitState = 'closed' | 'open' | 'half-open';

export class LLMProvider {
  private client: InferenceClient;
  private model: string;
  private temperature: number;
  private maxTokens: number;
  private resilience: Required<ResilienceOptions>;
  private agentName?: string;
  private collector: { record: (record: LLMCallRecord) => void } | undefined;

  // Circuit breaker state
  private circuitState: CircuitState = 'closed';
  private consecutiveFailures = 0;
  private circuitOpenedAt = 0;

  constructor(llmConfig: LLMProviderConfig) {
    this.resilience = {
      maxRetries: config.maxRetries,
      baseDelayMs: config.baseDelayMs,
      maxDelayMs: config.maxDelayMs,
      timeoutMs: config.timeoutMs,
      ...llmConfig.resilience,
    };

    this.client =
      llmConfig.client ??
      createInferenceClient({
        provider: llmConfig.provider ?? 'openai-compatible',
        apiKey: llmConfig.apiKey,
        baseUrl: llmConfig.baseUrl,
        timeoutMs: this.resilience.timeoutMs,
      });
    this.model = llmConfig.model;
    this.temperature = llmConfig.temperature ?? config.defaultTemperature;
    this.maxTokens = llmConfig.maxTokens ?? 4096;
    this.agentName = llmConfig.agentName;
    this.collector = llmConfig.collector ?? (llmConfig.agentName ? globalCollector : undefined);
  }

  /**
   * Verifica si el circuit breaker permite pasar la llamada.
   * Si el circuito está abierto y ya pasó el cooldown, pasa a half-open.
   */
  private checkCircuit(): void {
    if (this.circuitState === 'open') {
      const elapsed = Date.now() - this.circuitOpenedAt;
      if (elapsed >= CIRCUIT_BREAKER_COOLDOWN_MS) {
        this.circuitState = 'half-open';
        console.warn(`[LLMProvider] Circuit breaker: half-open tras ${elapsed}ms de cooldown`);
      } else {
        throw new LLMProviderError(
          `Circuit breaker abierto. Reintentando en ${CIRCUIT_BREAKER_COOLDOWN_MS - elapsed}ms`,
          'server',
        );
      }
    }
  }

  /** Registra un éxito: cierra el circuito y resetea contador. */
  private recordSuccess(): void {
    this.consecutiveFailures = 0;
    if (this.circuitState !== 'closed') {
      console.warn('[LLMProvider] Circuit breaker: cerrado tras éxito');
    }
    this.circuitState = 'closed';
  }

  /** Registra un fallo: incrementa contador y abre circuito si umbral alcanzado. */
  private recordFailure(errorKind: LLMErrorKind): void {
    // Solo contar fallos retryable (auth no cuenta para circuit breaker)
    if (
      errorKind === 'rate_limit' ||
      errorKind === 'server' ||
      errorKind === 'network' ||
      errorKind === 'timeout'
    ) {
      this.consecutiveFailures++;
      if (this.consecutiveFailures >= CIRCUIT_BREAKER_THRESHOLD && this.circuitState === 'closed') {
        this.circuitState = 'open';
        this.circuitOpenedAt = Date.now();
        console.warn(
          `[LLMProvider] Circuit breaker: ABIERTO tras ${this.consecutiveFailures} fallos consecutivos`,
        );
      }
    }
  }

  /**
   * Envía un historial completo de mensajes al proveedor configurado.
   * Reintenta con backoff exponencial + jitter ante errores transitorios,
   * lanza LLMProviderError tipada cuando la causa no es recuperable,
   * registra consumo/latencia en el collector configurado y respeta
   * el circuit breaker para evitar cascadas de fallos.
   */
  public async generateCompletion(
    messages: ChatMessage[],
    options: GenerateCompletionOptions = {},
  ): Promise<string> {
    const { maxRetries, baseDelayMs, maxDelayMs } = this.resilience;
    const kind = options.responseFormat ? 'structured' : 'text';

    this.checkCircuit();

    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      const startedAt = Date.now();
      try {
        const result = await this.attemptCompletion(messages, options);
        this.record(kind, true, Date.now() - startedAt, result.usage);
        this.recordSuccess();
        return result.content;
      } catch (error) {
        const providerError =
          error instanceof LLMProviderError ? error : classifyProviderError(error);
        this.record(kind, false, Date.now() - startedAt, ZERO_USAGE, providerError.kind);
        this.recordFailure(providerError.kind);

        const isLastAttempt = attempt > maxRetries;
        if (!providerError.retryable || isLastAttempt) {
          console.error(`[LLMProvider Error]: (${providerError.kind}) ${providerError.message}`);
          throw providerError;
        }

        const delay = providerError.retryAfterMs
          ? Math.min(providerError.retryAfterMs, maxDelayMs)
          : computeBackoffDelay(attempt, baseDelayMs, maxDelayMs);
        console.warn(
          `[LLMProvider] Intento ${attempt}/${maxRetries} falló (${providerError.kind}). Reintentando en ${delay}ms...`,
        );
        await sleep(delay);
      }
    }

    throw new LLMProviderError('Bucle de reintentos terminado inesperadamente', 'unknown');
  }

  protected async attemptCompletion(
    messages: ChatMessage[],
    options: GenerateCompletionOptions,
  ): Promise<CompletionResult> {
    try {
      return await this.client.complete({
        model: this.model,
        messages,
        temperature: this.temperature,
        maxTokens: this.maxTokens,
        ...(options.responseFormat ? { responseFormat: options.responseFormat } : {}),
      });
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
  const jitter = exponential * 0.25 * (Math.random() * 2 - 1);
  return Math.max(1, Math.round(exponential + jitter));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
