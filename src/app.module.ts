import { Module } from '@nestjs/common';

import { SharedModule } from '@presentation/rest/shared/shared.module';

/**
 * Root application module — composition root.
 *
 * Imports feature/cross-cutting modules. Intentionally contains no
 * controllers or providers of its own; everything is wired through the
 * imported modules.
 */
@Module({
  imports: [SharedModule],
})
export class AppModule {}
