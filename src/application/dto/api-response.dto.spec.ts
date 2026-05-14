import { ApiResponse, ApiResponseOf } from './api-response.dto';

class SampleDto {
  public id!: number;
}

describe('ApiResponse', () => {
  describe('of()', () => {
    it('sets success to true', () => {
      const res = ApiResponse.of({ id: 1 });
      expect(res.success).toBe(true);
    });

    it('sets code to 200', () => {
      const res = ApiResponse.of({ id: 1 });
      expect(res.code).toBe(200);
    });

    it('sets status to "OK"', () => {
      const res = ApiResponse.of({ id: 1 });
      expect(res.status).toBe('OK');
    });

    it('sets data to the provided value', () => {
      const payload = { id: 42, name: 'test' };
      const res = ApiResponse.of(payload);
      expect(res.data).toBe(payload);
    });

    it('sets timestamp to a recent epoch-ms number', () => {
      const before = Date.now();
      const res = ApiResponse.of({ id: 1 });
      const after = Date.now();
      expect(res.timestamp).toBeGreaterThanOrEqual(before);
      expect(res.timestamp).toBeLessThanOrEqual(after);
    });

    it('omits message when not provided', () => {
      const res = ApiResponse.of({ id: 1 });
      expect(res.message).toBeUndefined();
    });
  });

  describe('success()', () => {
    it('sets success to true', () => {
      const res = ApiResponse.success();
      expect(res.success).toBe(true);
    });

    it('sets code to 200', () => {
      const res = ApiResponse.success();
      expect(res.code).toBe(200);
    });

    it('sets status to "OK"', () => {
      const res = ApiResponse.success();
      expect(res.status).toBe('OK');
    });

    it('omits data', () => {
      const res = ApiResponse.success();
      expect(res.data).toBeUndefined();
    });

    it('sets timestamp to a recent epoch-ms number', () => {
      const before = Date.now();
      const res = ApiResponse.success();
      const after = Date.now();
      expect(res.timestamp).toBeGreaterThanOrEqual(before);
      expect(res.timestamp).toBeLessThanOrEqual(after);
    });
  });
});

describe('ApiResponseOf()', () => {
  it('returns a class named after the provided DTO', () => {
    const shaped = ApiResponseOf(SampleDto);
    expect(shaped.name).toBe('ApiResponseOfSampleDto');
  });

  it('returns an instantiable class', () => {
    const shaped = ApiResponseOf(SampleDto);
    expect(() => new shaped()).not.toThrow();
  });
});
