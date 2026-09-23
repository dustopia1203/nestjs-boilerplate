import { ApplicationErrorDef } from './application-error';
import { ApplicationException } from './application.exception';

const stubError = new ApplicationErrorDef(
  'authentication.unauthorised',
  'User is not authenticated',
);

describe('ApplicationException', () => {
  it('is an instance of Error', () => {
    expect(new ApplicationException(stubError)).toBeInstanceOf(Error);
  });

  it('sets name to ApplicationException', () => {
    expect(new ApplicationException(stubError).name).toBe('ApplicationException');
  });

  it('sets message from the catalog entry', () => {
    expect(new ApplicationException(stubError).message).toBe('User is not authenticated');
  });

  it('exposes the ApplicationError reference', () => {
    const exc = new ApplicationException(stubError);
    expect(exc.error).toBe(stubError);
  });

  it('defaults context to undefined', () => {
    expect(new ApplicationException(stubError).context).toBeUndefined();
  });

  it('accepts and exposes a context object', () => {
    const ctx = { userId: 'u1' } as const;
    expect(new ApplicationException(stubError, ctx).context).toBe(ctx);
  });

  it('retains native cause and log context', () => {
    const cause = new Error('original');
    const context = { operation: 'lookup' };
    const exception = new ApplicationException(stubError, context, { cause });
    expect(exception).toBeInstanceOf(Error);
    expect(exception.error).toBe(stubError);
    expect(exception.context).toBe(context);
    expect(exception.cause).toBe(cause);
  });
});
