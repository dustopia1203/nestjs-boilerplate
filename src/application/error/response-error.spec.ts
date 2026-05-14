import { ResponseErrorDef } from './response-error';

describe('ResponseErrorDef', () => {
  it('derives status 401 from code 401_000_002', () => {
    expect(new ResponseErrorDef(401_000_002, 'UNAUTHORISED', 'msg').status).toBe(401);
  });

  it('derives status 400 from code 400_000_001', () => {
    expect(new ResponseErrorDef(400_000_001, 'VALIDATION_FAILED', 'msg').status).toBe(400);
  });

  it('derives status 500 from code 500_000_001', () => {
    expect(new ResponseErrorDef(500_000_001, 'UNKNOWN', 'msg').status).toBe(500);
  });

  it('exposes code, name, and message as provided', () => {
    const def = new ResponseErrorDef(401_000_002, 'UNAUTHORISED', 'User is not authenticated');
    expect(def.code).toBe(401_000_002);
    expect(def.name).toBe('UNAUTHORISED');
    expect(def.message).toBe('User is not authenticated');
  });

  it('is frozen after construction', () => {
    expect(Object.isFrozen(new ResponseErrorDef(401_000_002, 'UNAUTHORISED', 'msg'))).toBe(true);
  });
});
