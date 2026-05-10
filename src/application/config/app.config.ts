import { registerAs, type ConfigType } from '@nestjs/config';
import { z } from 'zod';

const DEFAULT_PORT = 3000;

const appConfigSchema = z.object({
  PORT: z.coerce.number().int().positive().default(DEFAULT_PORT),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

/**
 * Validates an env-like record and returns a typed, camelCase config object.
 *
 * @param env - Raw env record (mirrors `process.env`).
 * @returns Validated config with `port` and `nodeEnv`.
 * @throws {z.ZodError} On invalid or missing required values.
 */
export function parseAppConfig(env: Record<string, string | undefined>): {
  port: number;
  nodeEnv: 'development' | 'production' | 'test';
} {
  const parsed = appConfigSchema.parse(env);
  return { port: parsed.PORT, nodeEnv: parsed.NODE_ENV };
}

/**
 * Registered `app` config group. Load via `ConfigModule` and inject with `appConfig.KEY`.
 */
export const appConfig = registerAs('app', () => parseAppConfig(process.env));

/**
 * Resolved type of the `app` config group.
 */
export type AppConfig = ConfigType<typeof appConfig>;
