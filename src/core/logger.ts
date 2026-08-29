/**
 * Configurable logger for the library.
 * By default, logs are silent (no output).
 * Consumers can set a custom logger to capture log messages.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface Logger {
  debug(message: string): void;
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
}

/** No-op logger (default). */
const noopLogger: Logger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};

let currentLogger: Logger = noopLogger;

/**
 * Sets the global logger for the library.
 * Pass `null` to restore the default silent logger.
 */
export function setLogger(logger: Logger | null): void {
  currentLogger = logger ?? noopLogger;
}

/** Returns the current logger instance. */
export function getLogger(): Logger {
  return currentLogger;
}
