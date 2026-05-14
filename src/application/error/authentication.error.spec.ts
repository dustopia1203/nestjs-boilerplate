import { AuthenticationError } from './authentication.error';

describe('AuthenticationError', () => {
  it('has an UNKNOWN entry', () => {
    expect(AuthenticationError.UNKNOWN).toBeDefined();
  });

  it('every entry derives status 401', () => {
    for (const entry of Object.values(AuthenticationError)) {
      expect(entry.status).toBe(401);
    }
  });

  it('all codes are unique', () => {
    const codes = Object.values(AuthenticationError).map((e) => e.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('all entries are frozen', () => {
    for (const entry of Object.values(AuthenticationError)) {
      expect(Object.isFrozen(entry)).toBe(true);
    }
  });
});
