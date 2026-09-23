import type { ApplicationError } from './application-error.interface';

/**
 * Immutable definition of a semantic application failure.
 */
export class ApplicationErrorDef implements ApplicationError {
  /**
   * Creates and freezes an application error definition.
   *
   * @param key - Stable identity of the failure.
   * @param message - Diagnostic description of the failure.
   */
  public constructor(
    public readonly key: string,
    public readonly message: string,
  ) {
    Object.freeze(this);
  }
}
