import { registerAs, type ConfigType } from '@nestjs/config';
import { z } from 'zod';

const DEFAULT_PORT = 3000;

const appConfigSchema = z.object({
  PORT: z.coerce.number().int().positive().default(DEFAULT_PORT),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

/**
 * Pure parser for the application config group.
 *
 * Validates an env-like record against the Zod schema and projects the raw
 * uppercase env names to the camelCase shape used by application code.
 * Exported separately from {@link appConfig} so it can be unit-tested without
 * Nest DI or `process.env` mutation.
 *
 * @param env - A record mimicking `process.env` (string values keyed by env name).
 * @returns The validated, camelCased config object.
 * @throws {z.ZodError} When any value fails validation or coercion.
 */
export function parseAppConfig(env: Record<string, string | undefined>): {
  port: number;
  nodeEnv: 'development' | 'production' | 'test';
} {
  const parsed = appConfigSchema.parse(env);
  return { port: parsed.PORT, nodeEnv: parsed.NODE_ENV };
}

/**
 * Registered `app` config group.
 *
 * Consumed by `ConfigModule.forRoot({ load: [appConfig] })` in the composition
 * root and injected elsewhere via `@Inject(appConfig.KEY)`.
 */
export const appConfig = registerAs('app', () => parseAppConfig(process.env));

/**
 * Type of the resolved `app` config, inferred from {@link appConfig}.
 *
 * Use as the parameter type when injecting: `config: AppConfig`.
 */
export type AppConfig = ConfigType<typeof appConfig>;
