import { type ArgumentsHost, Catch, type ExceptionFilter, HttpException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { v7 as uuidv7 } from 'uuid';
import { ZodError } from 'zod';

import { ApplicationException } from '@application/error/application.exception';
import { CommonError } from '@application/error/common.error';

import type { ErrorResponseDto } from '../dto/error-response.dto';
import { mapApplicationError, type HttpError } from '../error/http-error-mapping';
import { REQUEST_ID_HEADER } from '../request-id';

const HTTP_ERROR_CODE_MULTIPLIER = 1_000_000;

/** Internal resolution result produced by `classify()`. */
interface Classification {
  /** Resolved public HTTP error. */
  error: HttpError;
  /** Original thrown value preserved for log chaining. */
  cause?: unknown;
  /** Log-only key-value metadata; never included in the response body. */
  context?: Readonly<Record<string, unknown>>;
}

/** Metadata forwarded to every structured log entry. */
interface LogMeta {
  /** Request identifier for log correlation. */
  requestId: string;
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
    const requestId =
      typeof req.id === 'string' || typeof req.id === 'number' ? String(req.id) : uuidv7();
    res.setHeader(REQUEST_ID_HEADER, requestId);

    this.log(error, {
      requestId,
      path: req.url,
      cause,
      // exactOptionalPropertyTypes: only spread when defined to avoid explicit `undefined`
      ...(context !== undefined && { context }),
    });

    res.status(error.status).json({
      error: { code: error.code, name: error.name, message: error.message },
      timestamp: Date.now(),
      path: req.url,
      requestId,
    } satisfies ErrorResponseDto);
  }

  /**
   * Maps the thrown value to a public HTTP error and optional diagnostic data.
   *
   * @param exception - The thrown value.
   * @returns Classification with the resolved error, optional cause, and optional log context.
   */
  private classify(exception: unknown): Classification {
    if (exception instanceof ApplicationException) {
      return {
        error: mapApplicationError(exception.error),
        cause: exception,
        // exactOptionalPropertyTypes: only spread when defined to avoid explicit `undefined`
        ...(exception.context !== undefined && { context: exception.context }),
      };
    }
    if (exception instanceof ZodError) {
      return {
        error: mapApplicationError(CommonError.VALIDATION),
        cause: exception,
        context: { issues: exception.issues },
      };
    }
    if (exception instanceof HttpException) {
      return { error: this.mapHttpException(exception), cause: exception };
    }
    return { error: mapApplicationError(CommonError.UNKNOWN), cause: exception };
  }

  /**
   * Synthesises a public HTTP error from a NestJS HttpException.
   *
   * @param exc - The HttpException to convert.
   * @returns HTTP error preserving the original status with a name derived from the class name.
   */
  private mapHttpException(exc: HttpException): HttpError {
    const status = exc.getStatus();
    // BadRequestException → BadRequest → BAD_REQUEST; HttpException → HTTP
    const rawName = exc.constructor.name.replace(/Exception$/, '');
    const name = rawName.replaceAll(/(?<=[a-z])([A-Z])/g, '_$1').toUpperCase();
    return { status, code: status * HTTP_ERROR_CODE_MULTIPLIER, name, message: exc.message };
  }

  /**
   * Writes a structured log entry at the level appropriate for the error status range.
   *
   * @param error - The resolved public HTTP error.
   * @param meta - Request-scoped metadata to include in the log payload.
   */
  private log(error: HttpError, meta: LogMeta): void {
    const payload = {
      err: meta.cause,
      errorCode: error.code,
      errorName: error.name,
      requestId: meta.requestId,
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
