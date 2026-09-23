import { PageMeta, PagingApiResponse, PagingApiResponseOf } from './paging-api-response.dto';

class SampleItemDto {
  public id!: number;
}

const PAGE_META = { pageIndex: 0, pageSize: 20, total: 143 };
const ITEMS = [{ id: 1 }, { id: 2 }];

describe('PagingApiResponse', () => {
  describe('of()', () => {
    it('sets success to true', () => {
      const res = PagingApiResponse.of(ITEMS, PAGE_META);
      expect(res.success).toBe(true);
    });

    it('sets code to 200', () => {
      const res = PagingApiResponse.of(ITEMS, PAGE_META);
      expect(res.code).toBe(200);
    });

    it('sets status to "OK"', () => {
      const res = PagingApiResponse.of(ITEMS, PAGE_META);
      expect(res.status).toBe('OK');
    });

    it('sets data to the provided items array', () => {
      const res = PagingApiResponse.of(ITEMS, PAGE_META);
      expect(res.data).toBe(ITEMS);
    });

    it('sets page.pageIndex', () => {
      const res = PagingApiResponse.of(ITEMS, PAGE_META);
      expect(res.page.pageIndex).toBe(0);
    });

    it('sets page.pageSize', () => {
      const res = PagingApiResponse.of(ITEMS, PAGE_META);
      expect(res.page.pageSize).toBe(20);
    });

    it('sets page.total', () => {
      const res = PagingApiResponse.of(ITEMS, PAGE_META);
      expect(res.page.total).toBe(143);
    });

    it('sets timestamp to a recent epoch-ms number', () => {
      const before = Date.now();
      const res = PagingApiResponse.of(ITEMS, PAGE_META);
      const after = Date.now();
      expect(res.timestamp).toBeGreaterThanOrEqual(before);
      expect(res.timestamp).toBeLessThanOrEqual(after);
    });

    it('accepts an empty items array', () => {
      const res = PagingApiResponse.of([], { pageIndex: 0, pageSize: 20, total: 0 });
      expect(res.data).toEqual([]);
      expect(res.page.total).toBe(0);
    });
  });
});

describe('PageMeta', () => {
  it('sets all properties via constructor', () => {
    const meta = new PageMeta(1, 25, 200);
    expect(meta.pageIndex).toBe(1);
    expect(meta.pageSize).toBe(25);
    expect(meta.total).toBe(200);
  });
});

describe('PagingApiResponseOf()', () => {
  it('returns a class named after the provided DTO', () => {
    const shaped = PagingApiResponseOf(SampleItemDto);
    expect(shaped.name).toBe('PagingApiResponseOfSampleItemDto');
  });

  it('returns an instantiable class', () => {
    const shaped = PagingApiResponseOf(SampleItemDto);
    expect(() => new shaped()).not.toThrow();
  });
});
