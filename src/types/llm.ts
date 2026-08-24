/**
 * Contratos de la capa de inferencia LLM: configuración, resiliencia y errores.
 */

import type { LLMCallRecord } from './observability.js';

// Opciones de configuración para el proveedor de LLM
export interface LLMProviderConfig {
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  /** Política de reintentos, backoff y timeout */
  resilience?: ResilienceOptions;
  /** Nombre del agente dueño del proveedor (habilita registro de consumo) */
  agentName?: string;
  /**
   * Destino de los registros de consumo. Default: collector global
   * cuando se define agentName. Estructurally compatible con ObservabilityCollector.
   */
  collector?: { record: (record: LLMCallRecord) => void };
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

export interface GenerateCompletionOptions {
  /** Cuando se define, el proveedor fuerza una salida JSON conforme al esquema */
  responseFormat?: JsonSchemaResponseFormat;
}

// Formato de respuesta estructurada soportado por el proveedor
export interface JsonSchemaResponseFormat {
  type: 'json_schema';
  json_schema: { name: string; schema: Record<string, unknown> };
}

/**
 * Clasificación de errores del proveedor LLM según su causa.
 */
export type LLMErrorKind =
  | 'rate_limit'
  | 'auth'
  | 'bad_request'
  | 'timeout'
  | 'server'
  | 'network'
  | 'unknown';
