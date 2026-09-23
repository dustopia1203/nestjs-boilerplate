import { appConfig, defaultLevelForEnv, parseAppConfig } from './app.config';

describe('defaultLevelForEnv', () => {
  it('returns debug for development', () => {
    expect(defaultLevelForEnv('development')).toBe('debug');
  });

  it('returns info for production', () => {
    expect(defaultLevelForEnv('production')).toBe('info');
  });

  it('returns silent for test', () => {
    expect(defaultLevelForEnv('test')).toBe('silent');
  });
});

describe('parseAppConfig', () => {
  it('returns port and nodeEnv from env', () => {
    const result = parseAppConfig({ PORT: '4000', NODE_ENV: 'production' });

    expect(result.port).toBe(4000);
    expect(result.nodeEnv).toBe('production');
  });

  it('defaults port to 3000 when PORT is absent', () => {
    const result = parseAppConfig({});

    expect(result.port).toBe(3000);
  });

  it('defaults nodeEnv to development when NODE_ENV is absent', () => {
    const result = parseAppConfig({});

    expect(result.nodeEnv).toBe('development');
  });

  it.each(['abc', '0', '-1', '1.5'])('rejects invalid PORT=%s', (PORT) => {
    expect(() => parseAppConfig({ PORT })).toThrow();
  });

  it('preserves default runtime config', () => {
    expect(parseAppConfig({})).toEqual({
      port: 3000,
      nodeEnv: 'development',
      logLevel: 'debug',
      prettyPrint: true,
    });
  });

  it('resolves logLevel from NODE_ENV default when LOG_LEVEL is absent', () => {
    expect(parseAppConfig({ NODE_ENV: 'development' }).logLevel).toBe('debug');
    expect(parseAppConfig({ NODE_ENV: 'production' }).logLevel).toBe('info');
    expect(parseAppConfig({ NODE_ENV: 'test' }).logLevel).toBe('silent');
  });

  it('explicit LOG_LEVEL overrides the NODE_ENV default', () => {
    const result = parseAppConfig({ NODE_ENV: 'development', LOG_LEVEL: 'warn' });

    expect(result.logLevel).toBe('warn');
  });

  it('sets prettyPrint=true for development with non-silent level', () => {
    expect(parseAppConfig({ NODE_ENV: 'development' }).prettyPrint).toBe(true);
  });

  it('sets prettyPrint=false for production', () => {
    expect(parseAppConfig({ NODE_ENV: 'production' }).prettyPrint).toBe(false);
  });

  it('sets prettyPrint=false when logLevel is silent even in development', () => {
    expect(parseAppConfig({ NODE_ENV: 'development', LOG_LEVEL: 'silent' }).prettyPrint).toBe(
      false,
    );
  });

  it('throws a ZodError when LOG_LEVEL is not one of the allowed values', () => {
    expect(() => parseAppConfig({ LOG_LEVEL: 'verbose' })).toThrow(/LOG_LEVEL/);
  });
});

describe('appConfig (registerAs factory)', () => {
  it('registers the config group using the current environment', () => {
    const previousEnv = process.env;
    process.env = { PORT: '4010', NODE_ENV: 'production', LOG_LEVEL: 'warn' };
    try {
      expect(appConfig()).toEqual({
        port: 4010,
        nodeEnv: 'production',
        logLevel: 'warn',
        prettyPrint: false,
      });
    } finally {
      process.env = previousEnv;
    }
  });
});
