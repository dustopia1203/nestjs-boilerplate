import { ApplicationErrorDef } from './application-error';
import type { ApplicationError } from './application-error.interface';

/**
 * Cross-cutting catalog of generic application failures.
 */
export const CommonError = {
  UNKNOWN: new ApplicationErrorDef('common.unknown', 'Unexpected application failure'),
  VALIDATION: new ApplicationErrorDef('common.validation_failed', 'Input validation failed'),
} as const satisfies Record<string, ApplicationError>;
