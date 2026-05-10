import { appConfig, parseAppConfig } from './app.config';

describe('parseAppConfig', () => {
  it('returns a typed config with valid env values', () => {
    const result = parseAppConfig({ PORT: '4000', NODE_ENV: 'production' });

    expect(result).toStrictEqual({ port: 4000, nodeEnv: 'production' });
  });

  it('falls back to default PORT when PORT is missing', () => {
    const result = parseAppConfig({ NODE_ENV: 'development' });

    expect(result.port).toBe(3000);
    expect(result.nodeEnv).toBe('development');
  });

  it('falls back to default NODE_ENV when NODE_ENV is missing', () => {
    const result = parseAppConfig({ PORT: '8080' });

    expect(result.nodeEnv).toBe('development');
    expect(result.port).toBe(8080);
  });

  it('throws a ZodError when NODE_ENV is not one of the allowed values', () => {
    expect(() => parseAppConfig({ NODE_ENV: 'staging' })).toThrow(/NODE_ENV/);
  });

  it('throws a ZodError when PORT is not a numeric string', () => {
    expect(() => parseAppConfig({ PORT: 'not-a-number' })).toThrow(/PORT/);
  });
});

describe('appConfig (registerAs factory)', () => {
  it('invokes parseAppConfig with process.env and returns a typed config', () => {
    const result = appConfig();

    expect(result).toHaveProperty('port');
    expect(result).toHaveProperty('nodeEnv');
  });
});
