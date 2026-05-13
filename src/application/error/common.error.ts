import { ResponseErrorDef } from './response-error';
import type { ResponseError } from './response-error.interface';

/**
 * Cross-cutting error catalog for generic failure cases (UNKNOWN 500, VALIDATION_FAILED 400).
 */
export const CommonError = {
  UNKNOWN: new ResponseErrorDef(500_000_001, 'UNKNOWN', 'Internal server error'),
  VALIDATION: new ResponseErrorDef(400_000_001, 'VALIDATION_FAILED', 'Request validation failed'),
} as const satisfies Record<string, ResponseError>;
