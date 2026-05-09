import { Module } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';

/**
 * Root application module wiring the controller and service together.
 *
 * Intentionally minimal — additional feature modules should be imported here
 * as the application grows.
 */
@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
