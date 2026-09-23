import { ApplicationErrorDef } from './application-error';
import type { ApplicationError } from './application-error.interface';

/**
 * Error catalog for authentication failures.
 */
export const AuthenticationError = {
  UNKNOWN: new ApplicationErrorDef('authentication.unknown', 'Unknown authentication error'),
  UNAUTHORISED: new ApplicationErrorDef('authentication.unauthorised', 'User is not authenticated'),
} as const satisfies Record<string, ApplicationError>;
