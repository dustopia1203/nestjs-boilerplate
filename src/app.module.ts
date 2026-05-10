import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { appConfig } from '@application/config/app.config';
import { HealthModule } from '@presentation/rest/health/health.module';

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
    HealthModule,
  ],
})
export class AppModule {}
