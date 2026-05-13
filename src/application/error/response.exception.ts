import type { ResponseError } from './response-error.interface';

/**
 * Application exception wrapping a ResponseError catalog entry for use-case throw sites.
 */
export class ResponseException extends Error {
  /**
   * Creates a typed application exception from a catalog entry.
   *
   * @param error - The ResponseError catalog entry describing this failure.
   * @param context - Key-value pairs written to logs only; never included in the response body.
   * @param options - Native Error options; pass `cause` to chain the originating error.
   */
  public constructor(
    public readonly error: ResponseError,
    public readonly context?: Readonly<Record<string, unknown>>,
    options?: ErrorOptions,
  ) {
    super(error.message, options);
    this.name = 'ResponseException';
  }
}
