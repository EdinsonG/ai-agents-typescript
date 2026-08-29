/**
 * Contratos de la capa de inferencia LLM: configuración, resiliencia y errores.
 */

import type { ChatMessage } from './agent.js';
import type { LLMCallRecord } from './observability.js';

// Opciones de configuración para el proveedor de LLM
export interface LLMProviderConfig {
  apiKey: string;
  model: string;
  /** Protocolo del adaptador. Default: 'openai-compatible' */
  provider?: InferenceProviderKind;
  /** Endpoint base del proveedor. Default: Groq. Ver KNOWN_BASE_URLS */
  baseUrl?: string;
  /** Cliente de inferencia propio (escape total: implementa InferenceClient) */
  client?: InferenceClient;
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

/** Protocolos de inferencia soportados de fábrica. */
export type InferenceProviderKind = 'openai-compatible' | 'anthropic';

/** Uso de tokens reportado por el proveedor. */
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/** Resultado normalizado de un intento de inferencia. */
export interface CompletionResult {
  content: string;
  usage: TokenUsage;
}

/** Solicitud normalizada que todo adaptador debe traducir a su protocolo. */
export interface InferenceRequest {
  model: string;
  messages: ChatMessage[];
  temperature: number;
  maxTokens: number;
  /** Si el protocolo no soporta json_schema nativo, el adaptador lo traduce a prompt */
  responseFormat?: JsonSchemaResponseFormat;
}

/**
 * Contrato que desacopla el núcleo de cualquier SDK: implementa este
 * interfaz para integrar cualquier proveedor de modelos.
 */
export interface InferenceClient {
  complete(request: InferenceRequest): Promise<CompletionResult>;
  /** Streaming support — optional for backward compatibility */
  stream?(request: InferenceRequest): AsyncGenerator<StreamChunk, void, unknown>;
}

/** A single chunk from a streaming response. */
export interface StreamChunk {
  /** Delta content (partial text) */
  delta: string;
  /** Token usage (only in the final chunk, if available) */
  usage?: TokenUsage;
}

/** Mensaje de chat en formato OpenAI (estándar de facto). */
export interface OpenAIChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
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
