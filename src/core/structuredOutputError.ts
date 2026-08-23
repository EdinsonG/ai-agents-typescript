/**
 * Error cuando el modelo no produce una salida válida según el esquema,
 * tras agotar los reintentos con feedback.
 */
export class StructuredOutputError extends Error {
  public readonly agentName: string;
  public readonly attempts: number;
  public readonly lastRawOutput: string;

  constructor(agentName: string, attempts: number, lastRawOutput: string, cause?: unknown) {
    super(
      `[${agentName}] La salida no cumplió el esquema tras ${attempts} intento(s). ` +
        'Revisa lastRawOutput o reintenta.',
    );
    this.name = 'StructuredOutputError';
    this.agentName = agentName;
    this.attempts = attempts;
    this.lastRawOutput = lastRawOutput;
    if (cause !== undefined) {
      this.cause = cause;
    }
  }
}
