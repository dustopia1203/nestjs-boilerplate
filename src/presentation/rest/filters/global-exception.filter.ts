import { randomUUID } from 'node:crypto';

import { type ArgumentsHost, Catch, type ExceptionFilter, HttpException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { ZodError } from 'zod';

import type { ErrorResponseDto } from '@application/dto/error-response.dto';
import { CommonError } from '@application/error/common.error';
import { ResponseErrorDef } from '@application/error/response-error';
import type { ResponseError } from '@application/error/response-error.interface';
import { ResponseException } from '@application/error/response.exception';

/** Internal resolution result produced by `classify()`. */
interface Classification {
  /** Resolved error catalog entry. */
  error: ResponseError;
  /** Original thrown value preserved for log chaining. */
  cause?: unknown;
  /** Log-only key-value metadata; never included in the response body. */
  context?: Readonly<Record<string, unknown>>;
}

/** Metadata forwarded to every structured log entry. */
interface LogMeta {
  /** Trace identifier for log correlation. */
  traceId: string;
  /** Request URL path. */
  path: string;
  /** Original thrown value. */
  cause?: unknown;
  /** Log-only key-value metadata. */
  context?: Readonly<Record<string, unknown>>;
}

/**
 * Catches every unhandled exception and responds with a uniform error envelope.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  /**
   * Injects the request-scoped pino logger from nestjs-pino.
   *
   * @param logger - Pino logger for structured error logging.
   */
  public constructor(
    @InjectPinoLogger(GlobalExceptionFilter.name)
    private readonly logger: PinoLogger,
  ) {}

  /**
   * Classifies the exception, logs it at the appropriate level, and writes the error response.
   *
   * @param exception - The thrown value (any type).
   * @param host - NestJS arguments host for HTTP request/response access.
   */
  public catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const { error, cause, context } = this.classify(exception);
    // pino-http augments IncomingMessage with `id: ReqId`; guard covers object-type ids and
    // unit-test mocks that omit the field
    const traceId =
      typeof req.id === 'string' || typeof req.id === 'number' ? String(req.id) : randomUUID();

    this.log(error, {
      traceId,
      path: req.url,
      cause,
      // exactOptionalPropertyTypes: only spread when defined to avoid explicit `undefined`
      ...(context !== undefined && { context }),
    });

    res.status(error.status).json({
      error: { code: error.code, name: error.name, message: error.message },
      timestamp: Math.floor(Date.now() / 1000),
      path: req.url,
      traceId,
    } satisfies ErrorResponseDto);
  }

  /**
   * Maps the thrown value to a ResponseError and optional diagnostic data.
   *
   * @param exception - The thrown value.
   * @returns Classification with the resolved error, optional cause, and optional log context.
   */
  private classify(exception: unknown): Classification {
    if (exception instanceof ResponseException) {
      return {
        error: exception.error,
        cause: exception.cause,
        // exactOptionalPropertyTypes: only spread when defined to avoid explicit `undefined`
        ...(exception.context !== undefined && { context: exception.context }),
      };
    }
    if (exception instanceof ZodError) {
      return {
        error: CommonError.VALIDATION,
        cause: exception,
        context: { issues: exception.issues },
      };
    }
    if (exception instanceof HttpException) {
      return { error: this.mapHttpException(exception), cause: exception };
    }
    return { error: CommonError.UNKNOWN, cause: exception };
  }

  /**
   * Synthesises a ResponseError from a NestJS HttpException.
   *
   * @param exc - The HttpException to convert.
   * @returns A ResponseErrorDef preserving the original status with a name derived from the class name.
   */
  private mapHttpException(exc: HttpException): ResponseError {
    const status = exc.getStatus();
    // BadRequestException → BadRequest → BAD_REQUEST; HttpException → HTTP
    const rawName = exc.constructor.name.replace(/Exception$/, '');
    const name = rawName.replaceAll(/(?<=[a-z])([A-Z])/g, '_$1').toUpperCase();
    return new ResponseErrorDef(status * 1_000_000, name, exc.message);
  }

  /**
   * Writes a structured log entry at the level appropriate for the error status range.
   *
   * @param error - The resolved ResponseError.
   * @param meta - Request-scoped metadata to include in the log payload.
   */
  private log(error: ResponseError, meta: LogMeta): void {
    const payload = {
      err: meta.cause,
      errorCode: error.code,
      errorName: error.name,
      traceId: meta.traceId,
      path: meta.path,
      context: meta.context,
    };
    if (error.status >= 500) {
      this.logger.error(payload, error.message);
    } else if (error.status >= 400) {
      this.logger.warn(payload, error.message);
    } else {
      this.logger.info(payload, error.message);
    }
  }
}
