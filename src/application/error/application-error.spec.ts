import { ApplicationErrorDef } from './application-error';

describe('ApplicationErrorDef', () => {
  it('exposes key and message as provided without HTTP metadata', () => {
    const def = new ApplicationErrorDef('authentication.unauthorised', 'User is not authenticated');
    expect(def.key).toBe('authentication.unauthorised');
    expect(def.message).toBe('User is not authenticated');
    expect(def).not.toHaveProperty('status');
    expect(def).not.toHaveProperty('code');
  });

  it('is frozen after construction', () => {
    expect(Object.isFrozen(new ApplicationErrorDef('test.failure', 'msg'))).toBe(true);
  });
});
