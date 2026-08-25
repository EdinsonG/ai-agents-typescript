/**
 * Error HTTP de un proveedor. El campo status permite que
 * classifyProviderError lo tipifique (429 → rate_limit, 401 → auth, etc.)
 * sin acoplarse a ningún SDK.
 */
export class ProviderHttpError extends Error {
  public readonly status: number;

  constructor(message: string, status: number) {
    super(`HTTP ${status}: ${message}`);
    this.name = 'ProviderHttpError';
    this.status = status;
  }

  public static from(status: number, bodyText: string): ProviderHttpError {
    const snippet = bodyText.slice(0, 300);
    return new ProviderHttpError(snippet || 'sin cuerpo de respuesta', status);
  }
}
