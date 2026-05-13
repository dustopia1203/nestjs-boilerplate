import { CommonError } from './common.error';

describe('CommonError', () => {
  it('has an UNKNOWN entry', () => {
    expect(CommonError.UNKNOWN).toBeDefined();
  });

  it('UNKNOWN derives status 500', () => {
    expect(CommonError.UNKNOWN.status).toBe(500);
  });

  it('VALIDATION derives status 400', () => {
    expect(CommonError.VALIDATION.status).toBe(400);
  });

  it('all codes are unique', () => {
    const codes = Object.values(CommonError).map((e) => e.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('all entries are frozen', () => {
    for (const entry of Object.values(CommonError)) {
      expect(Object.isFrozen(entry)).toBe(true);
    }
  });
});
