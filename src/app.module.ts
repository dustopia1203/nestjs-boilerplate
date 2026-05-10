import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { appConfig } from '@application/config/app.config';
import { SharedModule } from '@presentation/rest/shared/shared.module';

/**
 * Root application module — composition root.
 *
 * Imports feature/cross-cutting modules and wires the global
 * `ConfigModule` so the validated `app` config group is available
 * everywhere via DI. Intentionally contains no controllers or providers
 * of its own; everything is wired through the imported modules.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [appConfig],
    }),
    SharedModule,
  ],
})
export class AppModule {}
