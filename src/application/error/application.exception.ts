import type { ApplicationError } from './application-error.interface';

/**
 * Wraps an application failure with log context and an optional cause.
 */
export class ApplicationException extends Error {
  /**
   * Creates an exception from an application error.
   *
   * @param error - Semantic application failure.
   * @param context - Diagnostic data for logs.
   * @param options - Native error options.
   */
  public constructor(
    public readonly error: ApplicationError,
    public readonly context?: Readonly<Record<string, unknown>>,
    options?: ErrorOptions,
  ) {
    super(error.message, options);
    this.name = 'ApplicationException';
  }
}
