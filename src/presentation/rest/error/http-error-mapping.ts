import type { ApplicationError } from '@application/error/application-error.interface';
import { AuthenticationError } from '@application/error/authentication.error';
import { CommonError } from '@application/error/common.error';

/** Public HTTP representation of an application error. */
export interface HttpError {
  /** HTTP status code. */
  readonly status: number;
  /** Public numeric error code. */
  readonly code: number;
  /** Public error identifier. */
  readonly name: string;
  /** Public error description. */
  readonly message: string;
}

const unknownHttpError: HttpError = Object.freeze({
  status: 500,
  code: 500_000_001,
  name: 'UNKNOWN',
  message: 'Internal server error',
});

const httpErrors = new Map<string, HttpError>([
  [CommonError.UNKNOWN.key, unknownHttpError],
  [
    CommonError.VALIDATION.key,
    Object.freeze({
      status: 400,
      code: 400_000_001,
      name: 'VALIDATION_FAILED',
      message: 'Request validation failed',
    }),
  ],
  [
    AuthenticationError.UNKNOWN.key,
    Object.freeze({
      status: 401,
      code: 401_000_001,
      name: 'UNKNOWN',
      message: 'Unknown authentication error',
    }),
  ],
  [
    AuthenticationError.UNAUTHORISED.key,
    Object.freeze({
      status: 401,
      code: 401_000_002,
      name: 'UNAUTHORISED',
      message: 'User is not authenticated',
    }),
  ],
]);

/**
 * Maps a semantic application failure to its public HTTP representation.
 *
 * @param error - Semantic application failure.
 * @returns Public HTTP error.
 */
export function mapApplicationError(error: ApplicationError): HttpError {
  return httpErrors.get(error.key) ?? unknownHttpError;
}
