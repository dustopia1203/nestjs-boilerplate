import type { ResponseError } from './response-error.interface';

/**
 * Immutable catalog value implementing ResponseError; shared across the request lifecycle.
 */
export class ResponseErrorDef implements ResponseError {
  /** HTTP status derived once from the first three digits of `code`. */
  public readonly status: number;

  /**
   * Builds and freezes an immutable error definition.
   *
   * @param code - Numeric error code; first 3 digits encode HTTP status (e.g. 401000002 → 401).
   * @param name - Upper-snake-case identifier for this error type.
   * @param message - Human-readable description of the error.
   */
  public constructor(
    public readonly code: number,
    public readonly name: string,
    public readonly message: string,
  ) {
    this.status = Math.floor(code / 1_000_000);
    Object.freeze(this);
  }
}
