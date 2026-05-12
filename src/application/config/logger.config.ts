import { registerAs, type ConfigType } from '@nestjs/config';
import { z } from 'zod';

const LOG_LEVELS = ['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent'] as const;

type LogLevel = (typeof LOG_LEVELS)[number];

const loggerConfigSchema = z.object({
  LOG_LEVEL: z.enum(LOG_LEVELS).optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

/**
 * Returns the default Pino log level for a given runtime environment.
 *
 * @param nodeEnv - The validated runtime environment string.
 * @returns The corresponding Pino log level.
 */
function defaultLevelForEnv(nodeEnv: 'development' | 'production' | 'test'): LogLevel {
  switch (nodeEnv) {
    case 'development': {
      return 'debug';
    }
    case 'production': {
      return 'info';
    }
    case 'test': {
      return 'silent';
    }
  }
}

/**
 * Validates an env-like record and returns a typed logger config object.
 *
 * @param env - Raw env record (mirrors `process.env`).
 * @returns Validated config with `logLevel` and `prettyPrint`.
 * @throws {z.ZodError} On invalid `LOG_LEVEL` or `NODE_ENV` values.
 */
export function parseLoggerConfig(env: Record<string, string | undefined>): {
  logLevel: LogLevel;
  prettyPrint: boolean;
} {
  const parsed = loggerConfigSchema.parse(env);
  const logLevel = parsed.LOG_LEVEL ?? defaultLevelForEnv(parsed.NODE_ENV);
  const prettyPrint = parsed.NODE_ENV === 'development' && logLevel !== 'silent';
  return { logLevel, prettyPrint };
}

/**
 * Registered `logger` config group. Load via `ConfigModule` and inject with `loggerConfig.KEY`.
 */
export const loggerConfig = registerAs('logger', () => parseLoggerConfig(process.env));

/**
 * Resolved type of the `logger` config group.
 */
export type LoggerConfig = ConfigType<typeof loggerConfig>;
