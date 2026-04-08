import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { setupApp } from './setup';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  // Apply shared setup
  setupApp(app);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  Logger.log(`🚀 BrandBook API running on http://localhost:${port}/api/v1`);
  Logger.log(`📚 Swagger docs at http://localhost:${port}/api/docs`);
}

bootstrap();
