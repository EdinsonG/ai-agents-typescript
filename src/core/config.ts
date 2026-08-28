/**
 * Configuración centralizada del proyecto.
 * Todos los defaults hardcodeados están aquí. Se pueden sobreescribir
 * con variables de entorno o con overrides en tiempo de ejecución.
 */

export interface AppConfig {
  /** Modelo por defecto cuando no se especifica uno */
  defaultModel: string;
  /** Temperature por defecto */
  defaultTemperature: number;
  /** Máximo de reintentos ante errores transitorios */
  maxRetries: number;
  /** Delay base en ms para backoff exponencial */
  baseDelayMs: number;
  /** Delay máximo en ms para backoff exponencial */
  maxDelayMs: number;
  /** Timeout por intento en ms */
  timeoutMs: number;
  /** Presupuesto máximo de tokens por contexto */
  maxContextTokens: number;
  /** Límite de caracteres en input del usuario */
  maxInputLength: number;
  /** Máximo de mensajes en chatHistory antes de evicción */
  maxChatHistory: number;
  /** Máximo de registros en el collector de observabilidad */
  maxObservabilityRecords: number;
  /** Máximo de revisiones en autocrítica */
  maxRevisions: number;
  /** Timeout por etapa del pipeline en ms */
  pipelineStageTimeoutMs: number;
}

function envInt(name: string, fallback: number): number {
  const value = process.env[name];
  if (value === undefined) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function envString(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

function loadConfig(): AppConfig {
  return {
    defaultModel: envString('AI_AGENT_DEFAULT_MODEL', 'llama-3.3-70b-versatile'),
    defaultTemperature: envInt('AI_AGENT_DEFAULT_TEMPERATURE', 2) / 10, // 2 → 0.2
    maxRetries: envInt('AI_AGENT_MAX_RETRIES', 3),
    baseDelayMs: envInt('AI_AGENT_BASE_DELAY_MS', 500),
    maxDelayMs: envInt('AI_AGENT_MAX_DELAY_MS', 8_000),
    timeoutMs: envInt('AI_AGENT_TIMEOUT_MS', 60_000),
    maxContextTokens: envInt('AI_AGENT_MAX_CONTEXT_TOKENS', 32_000),
    maxInputLength: envInt('AI_AGENT_MAX_INPUT_LENGTH', 10_000),
    maxChatHistory: envInt('AI_AGENT_MAX_CHAT_HISTORY', 100),
    maxObservabilityRecords: envInt('AI_AGENT_MAX_OBSERVABILITY_RECORDS', 10_000),
    maxRevisions: envInt('AI_AGENT_MAX_REVISIONS', 2),
    pipelineStageTimeoutMs: envInt('AI_AGENT_PIPELINE_STAGE_TIMEOUT_MS', 120_000),
  };
}

/** Config singleton. Se carga una vez al importar el módulo. */
export const config: AppConfig = loadConfig();

/**
 * Permite sobreescribir parcialmente la config en tests o en tiempo de ejecución.
 * Retorna una copia, no muta el singleton.
 */
export function overrideConfig(partial: Partial<AppConfig>): AppConfig {
  return { ...config, ...partial };
}
