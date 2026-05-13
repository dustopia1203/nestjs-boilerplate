/** All valid Pino log levels. */
export const LOG_LEVELS = ['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent'] as const;

/** Union of all valid Pino log level strings. */
export type LogLevel = (typeof LOG_LEVELS)[number];
