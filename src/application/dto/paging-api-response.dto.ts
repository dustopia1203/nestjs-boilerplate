import { STATUS_CODES } from 'node:http';

import { type Type } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

const HTTP_200 = 200;

/**
 * Pagination metadata attached to every paginated response.
 */
export class PageMeta {
  /** Zero-based page index. */
  @ApiProperty({ example: 0 })
  public readonly pageIndex: number;

  /** Number of items per page. */
  @ApiProperty({ example: 20 })
  public readonly pageSize: number;

  /** Total record count across all pages. */
  @ApiProperty({ example: 143 })
  public readonly total: number;

  /**
   * Constructs immutable page metadata.
   *
   * @param pageIndex - Zero-based index of the current page.
   * @param pageSize - Maximum number of items per page.
   * @param total - Total number of records across all pages.
   */
  public constructor(pageIndex: number, pageSize: number, total: number) {
    this.pageIndex = pageIndex;
    this.pageSize = pageSize;
    this.total = total;
  }
}

/**
 * Uniform paginated success-response envelope for list endpoints.
 */
export class PagingApiResponse<T> {
  /** Indicates the request succeeded. */
  @ApiProperty({ example: true })
  public readonly success = true;

  /** HTTP status code mirrored in the response body. */
  @ApiProperty({ example: 200 })
  public readonly code: number;

  /** HTTP status text derived from `code`. */
  @ApiProperty({ example: 'OK' })
  public readonly status: string;

  /** Paginated items for the current page. */
  @ApiProperty({ isArray: true })
  public readonly data: T[];

  /** Pagination metadata. */
  @ApiProperty({ type: PageMeta })
  public readonly page: PageMeta;

  /** Unix epoch milliseconds at envelope construction time. */
  @ApiProperty({ example: 1_715_698_800_000 })
  public readonly timestamp: number;

  /**
   * Builds a paginated success envelope.
   *
   * @param items - The items for the current page.
   * @param page - Pre-constructed pagination metadata.
   */
  private constructor(items: T[], page: PageMeta) {
    this.code = HTTP_200;
    // eslint-disable-next-line security/detect-object-injection -- STATUS_CODES is a trusted Node.js built-in keyed by HTTP status numbers
    this.status = STATUS_CODES[HTTP_200] ?? String(HTTP_200);
    this.data = items;
    this.page = page;
    this.timestamp = Date.now();
  }

  /**
   * Creates a 200 OK paginated envelope.
   *
   * @param items - The items for the current page.
   * @param page - Pagination metadata.
   * @returns A paginated success envelope.
   */
  public static of<T>(items: T[], page: PageMeta): PagingApiResponse<T> {
    return new PagingApiResponse<T>(items, page);
  }
}

/**
 * Returns a concrete typed class for use in Swagger `@ApiResponse` decorators that represents `PagingApiResponse<T>`.
 *
 * @param ItemDto - The DTO class representing a single item in the `data` array.
 * @returns A concrete class NestJS Swagger can reflect for schema generation.
 */
export function PagingApiResponseOf<T>(ItemDto: Type<T>): Type<unknown> {
  /**
   * Swagger schema mirror of `PagingApiResponse<T>` with a concrete item type.
   */
  class PagingApiResponseShape {
    @ApiProperty({ example: true })
    public readonly success!: boolean;

    @ApiProperty({ example: 200 })
    public readonly code!: number;

    @ApiProperty({ example: 'OK' })
    public readonly status!: string;

    @ApiProperty({ type: ItemDto, isArray: true })
    public readonly data!: T[];

    @ApiProperty({ type: PageMeta })
    public readonly page!: PageMeta;

    @ApiProperty({ example: 1_715_698_800_000 })
    public readonly timestamp!: number;
  }

  Object.defineProperty(PagingApiResponseShape, 'name', {
    value: `PagingApiResponseOf${ItemDto.name}`,
  });

  return PagingApiResponseShape;
}
