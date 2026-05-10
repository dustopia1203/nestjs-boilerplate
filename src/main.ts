import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { appConfig, type AppConfig } from '@application/config/app.config';

import { AppModule } from './app.module';

/**
 * Starts the app: mounts Swagger at `/api-docs`, then listens on the configured port.
 *
 * @returns Resolves once the HTTP server is bound and listening.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('myagt')
    .setDescription('myagt API documentation')
    .setVersion('1.0.0')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api-docs', app, document);

  const { port } = app.get<AppConfig>(appConfig.KEY);
  await app.listen(port);
}

void bootstrap();
