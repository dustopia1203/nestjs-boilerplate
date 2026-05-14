import type { INestApplication } from '@nestjs/common';
import { BadGatewayException, Controller, Get } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { Test, type TestingModule } from '@nestjs/testing';
import { LoggerModule } from 'nestjs-pino';
import request from 'supertest';
import { z } from 'zod';

import { AuthenticationError } from '../src/application/error/authentication.error';
import { ResponseException } from '../src/application/error/response.exception';
import { GlobalExceptionFilter } from '../src/presentation/rest/filters/global-exception.filter';

/** Minimal controller that throws each of the four classified exception types. */
@Controller('test-errors')
class TestErrorController {
  /** Throws a ResponseException with a catalog entry. */
  @Get('response-exception')
  public throwResponseException(): never {
    throw new ResponseException(AuthenticationError.UNAUTHORISED, { userId: 'u1' });
  }

  /** Throws a NestJS HttpException subclass. */
  @Get('http-exception')
  public throwHttpException(): never {
    throw new BadGatewayException('Bad gateway message');
  }

  /** Throws a ZodError by failing a schema parse. */
  @Get('zod-error')
  public throwZodError(): never {
    const result = z.object({ name: z.string() }).safeParse({ name: 123 });
    if (!result.success) throw result.error;
    throw new Error('Expected parse to fail');
  }

  /** Throws an unknown plain Error. */
  @Get('unknown')
  public throwUnknown(): never {
    throw new Error('boom');
  }

  /** Returns 200 to verify happy-path is unaffected by the filter. */
  @Get('ok')
  public healthy(): { status: string } {
    return { status: 'ok' };
  }
}

describe('GlobalExceptionFilter (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [LoggerModule.forRoot({ pinoHttp: { level: 'silent' } })],
      controllers: [TestErrorController],
      providers: [{ provide: APP_FILTER, useClass: GlobalExceptionFilter }],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('happy-path routes are unaffected', () => {
    return request(app.getHttpServer()).get('/test-errors/ok').expect(200).expect({ status: 'ok' });
  });

  it('ResponseException → 401 with nested error envelope', () => {
    return request(app.getHttpServer())
      .get('/test-errors/response-exception')
      .expect(401)
      .expect(({ body }: { body: Record<string, unknown> }) => {
        expect(body).toMatchObject({
          error: { code: 401_000_002, name: 'UNAUTHORISED' },
        });
        expect(body.traceId).toBeDefined();
        expect(body.timestamp).toBeDefined();
        expect(body).not.toHaveProperty('context');
      });
  });

  it('HttpException → preserves status with BAD_GATEWAY name', () => {
    return request(app.getHttpServer())
      .get('/test-errors/http-exception')
      .expect(502)
      .expect(({ body }: { body: Record<string, unknown> }) => {
        expect(body).toMatchObject({ error: { name: 'BAD_GATEWAY' } });
        expect(body.traceId).toBeDefined();
      });
  });

  it('ZodError → 400 VALIDATION_FAILED', () => {
    return request(app.getHttpServer())
      .get('/test-errors/zod-error')
      .expect(400)
      .expect(({ body }: { body: Record<string, unknown> }) => {
        expect(body).toMatchObject({ error: { name: 'VALIDATION_FAILED' } });
        expect(body.traceId).toBeDefined();
      });
  });

  it('unknown error → 500 UNKNOWN without leaking internals', () => {
    return request(app.getHttpServer())
      .get('/test-errors/unknown')
      .expect(500)
      .expect(({ body }: { body: Record<string, unknown> }) => {
        expect(body).toMatchObject({ error: { name: 'UNKNOWN' } });
        expect(body).not.toHaveProperty('stack');
        expect(body.traceId).toBeDefined();
      });
  });
});
