/**
 * Contract every error catalog entry must satisfy.
 */
export interface ResponseError {
  /** Numeric code; first 3 digits encode HTTP status (e.g. 40_100_002 → 401). */
  readonly code: number;

  /** Upper-snake-case error identifier. */
  readonly name: string;

  /** Human-readable error description. */
  readonly message: string;

  /** HTTP status derived from the code prefix. */
  readonly status: number;
}
