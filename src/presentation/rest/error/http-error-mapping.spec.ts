import { AuthenticationError } from '@application/error/authentication.error';
import { CommonError } from '@application/error/common.error';

import { mapApplicationError } from './http-error-mapping';

const cases = [
  [CommonError.UNKNOWN, 500, 500_000_001, 'UNKNOWN', 'Internal server error'],
  [CommonError.VALIDATION, 400, 400_000_001, 'VALIDATION_FAILED', 'Request validation failed'],
  [AuthenticationError.UNKNOWN, 401, 401_000_001, 'UNKNOWN', 'Unknown authentication error'],
  [AuthenticationError.UNAUTHORISED, 401, 401_000_002, 'UNAUTHORISED', 'User is not authenticated'],
] as const;

describe('mapApplicationError', () => {
  it.each(cases)('maps %j to its explicit HTTP contract', (error, status, code, name, message) => {
    expect(mapApplicationError(error)).toEqual({ status, code, name, message });
    expect(mapApplicationError({ key: error.key, message: 'private diagnostic' })).toEqual({
      status,
      code,
      name,
      message,
    });
  });

  it('covers every current catalog key', () => {
    const catalogKeys = [...Object.values(CommonError), ...Object.values(AuthenticationError)].map(
      (error) => error.key,
    );
    expect(new Set(cases.map(([error]) => error.key))).toEqual(new Set(catalogKeys));
    expect(cases).toHaveLength(catalogKeys.length);
  });

  it.each(['future.unmapped', '__proto__', 'constructor'])(
    'safely maps unrecognized key %s',
    (key) => {
      expect(mapApplicationError({ key, message: 'private diagnostic' })).toEqual({
        status: 500,
        code: 500_000_001,
        name: 'UNKNOWN',
        message: 'Internal server error',
      });
    },
  );
});
