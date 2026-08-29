/**
 * Error HTTP de un proveedor. El campo status permite que
 * classifyProviderError lo tipifique (429 → rate_limit, 401 → auth, etc.)
 * sin acoplarse a ningún SDK.
 * Incluye retryAfterMs para respetar el header Retry-After del servidor.
 */
export class ProviderHttpError extends Error {
  public readonly status: number;
  public readonly retryAfterMs?: number;

  constructor(message: string, status: number, retryAfterMs?: number) {
    super(`HTTP ${status}: ${message}`);
    this.name = 'ProviderHttpError';
    this.status = status;
    this.retryAfterMs = retryAfterMs;
  }

  public static from(status: number, bodyText: string, retryAfterMs?: number): ProviderHttpError {
    const snippet = bodyText.slice(0, 300);
    return new ProviderHttpError(snippet || 'sin cuerpo de respuesta', status, retryAfterMs);
  }
}
