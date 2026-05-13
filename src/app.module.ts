import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { LoggerModule, type Params } from 'nestjs-pino';

import { appConfig } from '@application/config/app.config';
import { loggerConfig, type LoggerConfig } from '@application/config/logger.config';
import { HealthModule } from '@presentation/rest/api/health/health.module';
import { GlobalExceptionFilter } from '@presentation/rest/filters/global-exception.filter';

/**
 * Builds pino-http options from the validated logger config.
 *
 * @param config - Validated logger config with log level and prettyPrint flag.
 * @returns pino-http configuration object for `LoggerModule`.
 */
function buildLoggerParams(config: LoggerConfig): Params {
  return {
    pinoHttp: {
      level: config.logLevel,
      ...(config.prettyPrint && {
        transport: { target: 'pino-pretty', options: { singleLine: true } },
      }),
    },
  };
}

/**
 * Root application module. Wires `ConfigModule` globally and imports all feature modules.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [appConfig, loggerConfig],
    }),
    LoggerModule.forRootAsync({
      useFactory: buildLoggerParams,
      inject: [loggerConfig.KEY],
    }),
    HealthModule,
  ],
  providers: [{ provide: APP_FILTER, useClass: GlobalExceptionFilter }],
})
export class AppModule {}
