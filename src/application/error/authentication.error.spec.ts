import { AuthenticationError } from './authentication.error';

describe('AuthenticationError', () => {
  it('uses a semantic identity without HTTP metadata', () => {
    expect(AuthenticationError.UNAUTHORISED).toMatchObject({
      key: 'authentication.unauthorised',
    });
    expect(AuthenticationError.UNAUTHORISED).not.toHaveProperty('status');
    expect(AuthenticationError.UNAUTHORISED).not.toHaveProperty('code');
  });

  it('has an UNKNOWN entry', () => {
    expect(AuthenticationError.UNKNOWN).toBeDefined();
  });

  it('keeps the UNKNOWN key and diagnostic message', () => {
    expect(AuthenticationError.UNKNOWN).toMatchObject({
      key: 'authentication.unknown',
      message: 'Unknown authentication error',
    });
  });

  it('keeps the UNAUTHORISED diagnostic message', () => {
    expect(AuthenticationError.UNAUTHORISED.message).toBe('User is not authenticated');
  });

  it('all entries are frozen', () => {
    for (const entry of Object.values(AuthenticationError)) {
      expect(Object.isFrozen(entry)).toBe(true);
    }
  });
});
