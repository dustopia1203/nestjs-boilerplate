/** Describes a semantic application failure without transport details. */
export interface ApplicationError {
  /** Stable identity of the failure. */
  readonly key: string;

  /** Diagnostic description of the failure. */
  readonly message: string;
}
