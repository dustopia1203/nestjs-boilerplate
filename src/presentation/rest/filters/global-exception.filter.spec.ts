import { BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import type { PinoLogger } from 'nestjs-pino';
import { z } from 'zod';

import { ApplicationErrorDef } from '@application/error/application-error';
import { ApplicationException } from '@application/error/application.exception';
import { AuthenticationError } from '@application/error/authentication.error';

import { GlobalExceptionFilter } from './global-exception.filter';

/** Shape of the JSON body written by the filter. */
interface ResponseBody {
  /** Structured error details. */
  error: { code: number; name: string; message: string };
  /** Unix epoch milliseconds. */
  timestamp: number;
  /** Request path. */
  path: string;
  /** pino-http trace identifier. */
  traceId: string;
}

function makeLogger(): jest.Mocked<Pick<PinoLogger, 'error' | 'warn' | 'info'>> {
  return { error: jest.fn(), warn: jest.fn(), info: jest.fn() };
}

function makeHost(reqOverrides: Record<string, unknown> = {}): {
  host: ArgumentsHost;
  statusFn: jest.Mock;
  jsonFn: jest.Mock<unknown, [unknown]>;
} {
  const jsonFn = jest.fn<unknown, [unknown]>();
  const statusFn = jest.fn().mockReturnValue({ json: jsonFn });
  const host = {
    switchToHttp: () => ({
      getRequest: () => ({ url: '/test', ...reqOverrides }),
      getResponse: () => ({ status: statusFn }),
    }),
  } as unknown as ArgumentsHost;
  return { host, statusFn, jsonFn };
}

describe('GlobalExceptionFilter', () => {
  afterEach(() => jest.restoreAllMocks());

  describe('ApplicationException classification', () => {
    it('hides unmapped application details and retains the exception in logs', () => {
      const logger = makeLogger();
      const filter = new GlobalExceptionFilter(logger as unknown as PinoLogger);
      const { host, statusFn, jsonFn } = makeHost();
      const exception = new ApplicationException(
        new ApplicationErrorDef('future.unmapped', 'diagnostic-only detail'),
        { operation: 'lookup' },
      );

      filter.catch(exception, host);

      expect(statusFn).toHaveBeenCalledWith(500);
      expect(jsonFn).toHaveBeenCalledWith(
        expect.objectContaining({
          error: { code: 500_000_001, name: 'UNKNOWN', message: 'Internal server error' },
        }),
      );
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({ err: exception, context: { operation: 'lookup' } }),
        'Internal server error',
      );
    });

    it('uses the mapped status and code', () => {
      const filter = new GlobalExceptionFilter(makeLogger() as unknown as PinoLogger);
      const { host, statusFn, jsonFn } = makeHost({ id: 'trace-1' });

      filter.catch(
        new ApplicationException(AuthenticationError.UNAUTHORISED, { userId: 'u1' }),
        host,
      );

      expect(statusFn).toHaveBeenCalledWith(401);
      const body = jsonFn.mock.calls[0]?.[0] as ResponseBody;
      expect(body.error.code).toBe(401_000_002);
      expect(body.error.name).toBe('UNAUTHORISED');
      expect(body.traceId).toBe('trace-1');
    });

    it('does not include context in the response body', () => {
      const filter = new GlobalExceptionFilter(makeLogger() as unknown as PinoLogger);
      const { host, jsonFn } = makeHost();

      filter.catch(
        new ApplicationException(AuthenticationError.UNAUTHORISED, { userId: 'u1' }),
        host,
      );

      expect(jsonFn.mock.calls[0]?.[0] as Record<string, unknown>).not.toHaveProperty('context');
    });

    it('includes context in the log payload', () => {
      const logger = makeLogger();
      const filter = new GlobalExceptionFilter(logger as unknown as PinoLogger);
      const { host } = makeHost();

      filter.catch(
        new ApplicationException(AuthenticationError.UNAUTHORISED, { userId: 'u1' }),
        host,
      );

      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({ context: { userId: 'u1' } }),
        'User is not authenticated',
      );
    });
  });

  describe('ZodError classification', () => {
    it('maps to status 400 with name VALIDATION_FAILED', () => {
      const filter = new GlobalExceptionFilter(makeLogger() as unknown as PinoLogger);
      const { host, statusFn, jsonFn } = makeHost();
      const parseResult = z.object({ name: z.string() }).safeParse({ name: 123 });
      if (parseResult.success) throw new Error('Expected parse to fail');

      filter.catch(parseResult.error, host);

      expect(statusFn).toHaveBeenCalledWith(400);
      expect((jsonFn.mock.calls[0]?.[0] as ResponseBody).error.name).toBe('VALIDATION_FAILED');
    });

    it('includes zod issues in the log payload context', () => {
      const logger = makeLogger();
      const filter = new GlobalExceptionFilter(logger as unknown as PinoLogger);
      const { host } = makeHost();
      const parseResult = z.object({ name: z.string() }).safeParse({ name: 123 });
      if (parseResult.success) throw new Error('Expected parse to fail');

      filter.catch(parseResult.error, host);

      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({ context: { issues: parseResult.error.issues } }),
        expect.any(String),
      );
    });
  });

  describe('HttpException classification', () => {
    it('preserves the original HTTP status', () => {
      const filter = new GlobalExceptionFilter(makeLogger() as unknown as PinoLogger);
      const { host, statusFn } = makeHost();

      filter.catch(new BadRequestException('bad input'), host);

      expect(statusFn).toHaveBeenCalledWith(400);
    });

    it('derives name from the exception class name', () => {
      const filter = new GlobalExceptionFilter(makeLogger() as unknown as PinoLogger);
      const { host, jsonFn } = makeHost();

      filter.catch(new BadRequestException('bad input'), host);

      expect((jsonFn.mock.calls[0]?.[0] as ResponseBody).error.name).toBe('BAD_REQUEST');
    });

    it('handles the base HttpException class', () => {
      const filter = new GlobalExceptionFilter(makeLogger() as unknown as PinoLogger);
      const { host, statusFn, jsonFn } = makeHost();

      filter.catch(new HttpException('forbidden', HttpStatus.FORBIDDEN), host);

      expect(statusFn).toHaveBeenCalledWith(403);
      expect((jsonFn.mock.calls[0]?.[0] as ResponseBody).error.name).toBe('HTTP');
    });
  });

  describe('unknown error classification', () => {
    it('maps to status 500 with name UNKNOWN', () => {
      const filter = new GlobalExceptionFilter(makeLogger() as unknown as PinoLogger);
      const { host, statusFn, jsonFn } = makeHost();

      filter.catch(new Error('boom'), host);

      expect(statusFn).toHaveBeenCalledWith(500);
      expect((jsonFn.mock.calls[0]?.[0] as ResponseBody).error.name).toBe('UNKNOWN');
    });

    it('does not leak stack or cause in the response body', () => {
      const filter = new GlobalExceptionFilter(makeLogger() as unknown as PinoLogger);
      const { host, jsonFn } = makeHost();

      filter.catch(new Error('boom'), host);

      const body = jsonFn.mock.calls[0]?.[0] as Record<string, unknown>;
      expect(body).not.toHaveProperty('stack');
      expect(body).not.toHaveProperty('cause');
    });
  });

  describe('traceId', () => {
    it('uses req.id when present', () => {
      const filter = new GlobalExceptionFilter(makeLogger() as unknown as PinoLogger);
      const { host, jsonFn } = makeHost({ id: 'my-trace' });

      filter.catch(new Error('test error'), host);

      expect((jsonFn.mock.calls[0]?.[0] as ResponseBody).traceId).toBe('my-trace');
    });

    it('generates a UUID when req.id is absent', () => {
      const filter = new GlobalExceptionFilter(makeLogger() as unknown as PinoLogger);
      const { host, jsonFn } = makeHost();

      filter.catch(new Error('test error'), host);

      expect((jsonFn.mock.calls[0]?.[0] as ResponseBody).traceId).toMatch(
        /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/,
      );
    });
  });

  describe('log level routing', () => {
    it('logs at error level for 5xx status', () => {
      const logger = makeLogger();
      const filter = new GlobalExceptionFilter(logger as unknown as PinoLogger);
      const { host } = makeHost();

      filter.catch(new Error('boom'), host);

      expect(logger.error).toHaveBeenCalled();
      expect(logger.warn).not.toHaveBeenCalled();
    });

    it('logs at warn level for 4xx status', () => {
      const logger = makeLogger();
      const filter = new GlobalExceptionFilter(logger as unknown as PinoLogger);
      const { host } = makeHost();

      filter.catch(new ApplicationException(AuthenticationError.UNAUTHORISED), host);

      expect(logger.warn).toHaveBeenCalled();
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('logs at info level for sub-4xx status', () => {
      const logger = makeLogger();
      const filter = new GlobalExceptionFilter(logger as unknown as PinoLogger);
      const { host } = makeHost();
      filter.catch(new HttpException('ok', HttpStatus.OK), host);

      expect(logger.info).toHaveBeenCalled();
      expect(logger.warn).not.toHaveBeenCalled();
      expect(logger.error).not.toHaveBeenCalled();
    });
  });

  describe('response body shape', () => {
    it('writes the current epoch in milliseconds', () => {
      const now = 1_747_141_920_123;
      jest.spyOn(Date, 'now').mockReturnValue(now);
      const filter = new GlobalExceptionFilter(makeLogger() as unknown as PinoLogger);
      const { host, jsonFn } = makeHost({ id: 'trace-ms' });

      filter.catch(new Error('failure'), host);

      expect(jsonFn).toHaveBeenCalledWith(expect.objectContaining({ timestamp: now }));
    });

    it('always includes error, timestamp, path, and traceId', () => {
      const filter = new GlobalExceptionFilter(makeLogger() as unknown as PinoLogger);
      const { host, jsonFn } = makeHost({ id: 'trace-x' });

      filter.catch(new Error('test error'), host);

      const body = jsonFn.mock.calls[0]?.[0] as Record<string, unknown>;
      expect(body).toHaveProperty('error');
      expect(body).toHaveProperty('timestamp');
      expect(body).toHaveProperty('path');
      expect(body).toHaveProperty('traceId', 'trace-x');
    });
  });
});
