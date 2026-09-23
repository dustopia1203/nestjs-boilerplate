import { STATUS_CODES } from 'node:http';

import { type Type } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const HTTP_200 = 200;

/**
 * Uniform success-response envelope for all REST endpoints.
 */
export class ApiResponse<T> {
  /** Indicates the request succeeded. */
  @ApiProperty({ example: true })
  public readonly success = true;

  /** HTTP status code mirrored in the response body. */
  @ApiProperty({ example: 200 })
  public readonly code: number;

  /** HTTP status text derived from `code`. */
  @ApiProperty({ example: 'OK' })
  public readonly status: string;

  /** Optional human-readable message; omitted from serialisation when absent. */
  @ApiPropertyOptional({ example: 'Operation completed successfully' })
  public readonly message: string | undefined;

  /** Response payload; omitted from serialisation when absent (e.g. no-content responses). */
  @ApiPropertyOptional()
  public readonly data: T | undefined;

  /** Unix epoch milliseconds at envelope construction time. */
  @ApiProperty({ example: 1_715_698_800_000 })
  public readonly timestamp: number;

  /**
   * Builds a success envelope.
   *
   * @param code - HTTP status code to mirror in the body.
   * @param data - Response payload, or `undefined` for no-body responses.
   * @param message - Optional human-readable message.
   */
  private constructor(code: number, data: T | undefined, message: string | undefined) {
    this.code = code;
    // eslint-disable-next-line security/detect-object-injection -- STATUS_CODES is a trusted Node.js built-in keyed by HTTP status numbers
    this.status = STATUS_CODES[code] ?? String(code);
    this.data = data;
    this.message = message;
    this.timestamp = Date.now();
  }

  /**
   * Creates a 200 OK envelope carrying a response body.
   *
   * @param data - The response payload.
   * @returns A success envelope with the provided data.
   */
  public static of<T>(data: T): ApiResponse<T> {
    return new ApiResponse<T>(HTTP_200, data, undefined);
  }

  /**
   * Creates a 200 OK envelope with no response body.
   *
   * @returns A success envelope with no data or message.
   */
  public static success(): ApiResponse<never> {
    return new ApiResponse<never>(HTTP_200, undefined, undefined);
  }
}

/**
 * Returns a concrete typed class for use in Swagger `@ApiResponse` decorators that represents `ApiResponse<T>`.
 *
 * @param DataDto - The DTO class representing the `data` field type.
 * @returns A concrete class NestJS Swagger can reflect for schema generation.
 */
export function ApiResponseOf<T>(DataDto: Type<T>): Type<unknown> {
  /**
   * Swagger schema mirror of `ApiResponse<T>` with a concrete `data` type.
   */
  class ApiResponseShape {
    @ApiProperty({ example: true })
    public readonly success!: boolean;

    @ApiProperty({ example: 200 })
    public readonly code!: number;

    @ApiProperty({ example: 'OK' })
    public readonly status!: string;

    @ApiPropertyOptional({ example: 'Operation completed successfully' })
    public readonly message?: string;

    @ApiProperty({ type: DataDto })
    public readonly data!: T;

    @ApiProperty({ example: 1_715_698_800_000 })
    public readonly timestamp!: number;
  }

  Object.defineProperty(ApiResponseShape, 'name', {
    value: `ApiResponseOf${DataDto.name}`,
  });

  return ApiResponseShape;
}
