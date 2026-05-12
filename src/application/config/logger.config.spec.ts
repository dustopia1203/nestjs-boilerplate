import { loggerConfig, parseLoggerConfig } from './logger.config';

describe('parseLoggerConfig', () => {
  it('returns debug level and prettyPrint=true for development without LOG_LEVEL', () => {
    const result = parseLoggerConfig({ NODE_ENV: 'development' });

    expect(result).toStrictEqual({ logLevel: 'debug', prettyPrint: true });
  });

  it('returns info level and prettyPrint=false for production without LOG_LEVEL', () => {
    const result = parseLoggerConfig({ NODE_ENV: 'production' });

    expect(result).toStrictEqual({ logLevel: 'info', prettyPrint: false });
  });

  it('returns silent level and prettyPrint=false for test without LOG_LEVEL', () => {
    const result = parseLoggerConfig({ NODE_ENV: 'test' });

    expect(result).toStrictEqual({ logLevel: 'silent', prettyPrint: false });
  });

  it('defaults NODE_ENV to development when NODE_ENV is missing', () => {
    const result = parseLoggerConfig({});

    expect(result).toStrictEqual({ logLevel: 'debug', prettyPrint: true });
  });

  it('LOG_LEVEL override wins over NODE_ENV default', () => {
    const result = parseLoggerConfig({ NODE_ENV: 'development', LOG_LEVEL: 'warn' });

    expect(result).toStrictEqual({ logLevel: 'warn', prettyPrint: true });
  });

  it('prettyPrint is false when LOG_LEVEL=silent even in development', () => {
    const result = parseLoggerConfig({ NODE_ENV: 'development', LOG_LEVEL: 'silent' });

    expect(result).toStrictEqual({ logLevel: 'silent', prettyPrint: false });
  });

  it('LOG_LEVEL override in production does not enable prettyPrint', () => {
    const result = parseLoggerConfig({ NODE_ENV: 'production', LOG_LEVEL: 'debug' });

    expect(result).toStrictEqual({ logLevel: 'debug', prettyPrint: false });
  });

  it('throws a ZodError when LOG_LEVEL is not one of the allowed values', () => {
    expect(() => parseLoggerConfig({ LOG_LEVEL: 'verbose' })).toThrow(/LOG_LEVEL/);
  });
});

describe('loggerConfig (registerAs factory)', () => {
  it('invokes parseLoggerConfig with process.env and returns a typed config', () => {
    const result = loggerConfig();

    expect(result).toHaveProperty('logLevel');
    expect(result).toHaveProperty('prettyPrint');
  });
});
