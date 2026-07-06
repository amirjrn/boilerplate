import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: false,

      // Timeout Settings (optimized for reliability)
      keepAliveTimeout: 72000, // 72s - Longer than typical load balancer timeout (60s)
      requestTimeout: 30000, // 30s - Reasonable timeout for most API operations

      // Reliability Settings
      maxParamLength: 500, // Prevent excessively long URL params

      // Trust proxy (important if behind nginx/load balancer)
      trustProxy: true,
    }),
  );

  app.useGlobalPipes(new ValidationPipe());

  // Set global prefix for all routes
  app.setGlobalPrefix('api/v1');

  const swagger = new DocumentBuilder()
    .setTitle('Bob API')
    .setDescription('The App which Alice uses to communicate with')
    .setVersion('1.0')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, swagger);
  SwaggerModule.setup('api', app, documentFactory, {
    jsonDocumentUrl: 'swagger/json',
    yamlDocumentUrl: 'swagger/yaml',
  });

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
