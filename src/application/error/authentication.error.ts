import { ResponseErrorDef } from './response-error';
import type { ResponseError } from './response-error.interface';

/**
 * Error catalog for authentication failures (HTTP 401).
 */
export const AuthenticationError = {
  UNKNOWN: new ResponseErrorDef(401_000_001, 'UNKNOWN', 'Unknown authentication error'),
  UNAUTHORISED: new ResponseErrorDef(401_000_002, 'UNAUTHORISED', 'User is not authenticated'),
} as const satisfies Record<string, ResponseError>;
