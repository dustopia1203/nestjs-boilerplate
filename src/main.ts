import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

/**
 * Bootstrap the NestJS application and start the HTTP listener.
 *
 * Reads the `PORT` environment variable (defaults to `3000`) and binds the
 * Express adapter to that port. Any startup error is propagated so the
 * process exits with a non-zero status.
 *
 * @returns A promise that resolves once the server is listening.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const port = Number.parseInt(process.env['PORT'] ?? '3000', 10);
  await app.listen(port);
}

void bootstrap();
