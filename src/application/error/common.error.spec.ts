import { AuthenticationError } from './authentication.error';
import { CommonError } from './common.error';

describe('CommonError', () => {
  it('has an UNKNOWN entry', () => {
    expect(CommonError.UNKNOWN).toBeDefined();
  });

  it('UNKNOWN has a semantic key and diagnostic message', () => {
    expect(CommonError.UNKNOWN).toMatchObject({
      key: 'common.unknown',
      message: 'Unexpected application failure',
    });
  });

  it('VALIDATION has a semantic key and diagnostic message', () => {
    expect(CommonError.VALIDATION).toMatchObject({
      key: 'common.validation_failed',
      message: 'Input validation failed',
    });
  });

  it('keeps all catalog keys globally unique and definitions frozen', () => {
    const entries = [...Object.values(CommonError), ...Object.values(AuthenticationError)];
    expect(new Set(entries.map((entry) => entry.key)).size).toBe(entries.length);
    for (const entry of entries) {
      expect(Object.isFrozen(entry)).toBe(true);
      expect(entry).not.toHaveProperty('status');
      expect(entry).not.toHaveProperty('code');
    }
  });
});
