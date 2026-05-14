import { ResponseErrorDef } from './response-error';
import { ResponseException } from './response.exception';

const stubError = new ResponseErrorDef(40_100_002, 'UNAUTHORISED', 'User is not authenticated');

describe('ResponseException', () => {
  it('is an instance of Error', () => {
    expect(new ResponseException(stubError)).toBeInstanceOf(Error);
  });

  it('sets name to ResponseException', () => {
    expect(new ResponseException(stubError).name).toBe('ResponseException');
  });

  it('sets message from the catalog entry', () => {
    expect(new ResponseException(stubError).message).toBe('User is not authenticated');
  });

  it('exposes the ResponseError reference', () => {
    const exc = new ResponseException(stubError);
    expect(exc.error).toBe(stubError);
  });

  it('defaults context to undefined', () => {
    expect(new ResponseException(stubError).context).toBeUndefined();
  });

  it('accepts and exposes a context object', () => {
    const ctx = { userId: 'u1' } as const;
    expect(new ResponseException(stubError, ctx).context).toBe(ctx);
  });

  it('preserves cause via ErrorOptions', () => {
    const cause = new Error('original');
    const exc = new ResponseException(stubError, undefined, { cause });
    expect(exc.cause).toBe(cause);
  });
});
