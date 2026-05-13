import { ApiProperty } from '@nestjs/swagger';

/**
 * Error details nested inside every error response envelope.
 */
export class ErrorBodyDto {
  /** Numeric code; first 3 digits encode HTTP status (e.g. 401_000_002 → HTTP 401). */
  @ApiProperty({ example: 401_000_002 })
  public code!: number;

  /** Upper-snake-case error identifier. */
  @ApiProperty({ example: 'UNAUTHORISED' })
  public name!: string;

  /** Human-readable error description. */
  @ApiProperty({ example: 'User is not authenticated' })
  public message!: string;
}

/**
 * Uniform HTTP error response shape produced by GlobalExceptionFilter for every error.
 */
export class ErrorResponseDto {
  /** Structured error details. */
  @ApiProperty({ type: ErrorBodyDto })
  public error!: ErrorBodyDto;

  /** Unix epoch seconds of when the error was handled. */
  @ApiProperty({ example: 1_747_141_920 })
  public timestamp!: number;

  /** Request path that triggered the error. */
  @ApiProperty({ example: '/health/live' })
  public path!: string;

  /** Trace identifier from pino-http for log correlation. */
  @ApiProperty({ example: 'a3f9c2e1-4b5a-6c7d-8e9f-0a1b2c3d4e5f' })
  public traceId!: string;
}
