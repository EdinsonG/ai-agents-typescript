import { StructuredOutputError } from './structuredOutputError.js';

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

const RETRYABLE_KINDS: readonly LLMErrorKind[] = ['rate_limit', 'timeout', 'server', 'network'];

export function isRetryableKind(kind: LLMErrorKind): boolean {
  return RETRYABLE_KINDS.includes(kind);
}

export { StructuredOutputError };

/**
 * Error tipado producido por la capa de inferencia.
 * Permite a los consumidores reaccionar sin acoplarse al SDK de Groq.
 */
export class LLMProviderError extends Error {
  public readonly kind: LLMErrorKind;
  public readonly statusCode?: number;
  public readonly retryable: boolean;

  constructor(message: string, kind: LLMErrorKind, statusCode?: number, cause?: unknown) {
    super(`[${kind}] ${message}`);
    this.name = 'LLMProviderError';
    this.kind = kind;
    this.statusCode = statusCode;
    this.retryable = isRetryableKind(kind);
    if (cause !== undefined) {
      this.cause = cause;
    }
  }
}

/**
 * Extrae el código HTTP de un error arbitrario (p. ej. APIError del SDK) sin acoplarse a su tipo.
 */
export function extractStatusCode(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null || !('status' in error)) return undefined;
  const status = (error as { status?: unknown }).status;
  return typeof status === 'number' ? status : undefined;
}

export function classifyProviderError(error: unknown): LLMProviderError {
  const statusCode = extractStatusCode(error);
  const originalMessage = error instanceof Error ? error.message : String(error);

  let kind: LLMErrorKind;
  if (statusCode === undefined) {
    kind = /timed?\s*out|abort/i.test(originalMessage) ? 'timeout' : 'network';
  } else if (statusCode === 400 || statusCode === 404 || statusCode === 422) {
    kind = 'bad_request';
  } else if (statusCode === 401 || statusCode === 403) {
    kind = 'auth';
  } else if (statusCode === 408) {
    kind = 'timeout';
  } else if (statusCode === 429) {
    kind = 'rate_limit';
  } else if (statusCode >= 500) {
    kind = 'server';
  } else {
    kind = 'unknown';
  }

  return new LLMProviderError(originalMessage, kind, statusCode, error);
}
