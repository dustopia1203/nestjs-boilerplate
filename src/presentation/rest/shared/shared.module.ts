import { Module } from '@nestjs/common';

import { AppService } from '@application/shared/service/app.service';

import { AppController } from './app.controller';

/**
 * Cross-cutting Nest module wiring the seed controller and its service.
 *
 * Lives in `presentation/rest/shared` because it owns a REST controller. As
 * real bounded contexts emerge, each context will own its own module, and
 * this one will either disappear or shrink to truly cross-cutting concerns.
 */
@Module({
  controllers: [AppController],
  providers: [AppService],
  exports: [AppService],
})
export class SharedModule {}
