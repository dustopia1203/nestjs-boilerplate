import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { LoggerModule, type Params } from 'nestjs-pino';

import { appConfig, type AppConfig } from '@application/config/app.config';
import { HealthModule } from '@presentation/rest/api/health/health.module';
import { GlobalExceptionFilter } from '@presentation/rest/filters/global-exception.filter';

/**
 * Builds pino-http options from the validated app config.
 *
 * @param config - Validated app config with log level and prettyPrint flag.
 * @returns pino-http configuration object for `LoggerModule`.
 */
function buildLoggerParams(config: AppConfig): Params {
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
      load: [appConfig],
    }),
    LoggerModule.forRootAsync({
      useFactory: buildLoggerParams,
      inject: [appConfig.KEY],
    }),
    HealthModule,
  ],
  providers: [{ provide: APP_FILTER, useClass: GlobalExceptionFilter }],
})
export class AppModule {}
