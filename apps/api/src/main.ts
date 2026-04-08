import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as express from 'express';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  // Security
  app.use(helmet());
  app.enableShutdownHooks();

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // CORS
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const origins = frontendUrl.includes(',') 
    ? frontendUrl.split(',').map(url => url.trim()) 
    : frontendUrl;

  app.enableCors({
    origin: origins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Increase payload size for file uploads
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Swagger documentation
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('BrandBook Client OS API')
      .setDescription('Multi-tenant client management platform API')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'Authentication endpoints')
      .addTag('users', 'User management')
      .addTag('tenants', 'Tenant management')
      .addTag('projects', 'Project workspace')
      .addTag('creatives', 'Content & creatives')
      .addTag('approvals', 'Approval system')
      .addTag('crm', 'CRM leads')
      .addTag('communications', 'Threads & comments')
      .addTag('reports', 'Ad reporting')
      .addTag('onboarding', 'Project onboarding')
      .addTag('calendar', 'Content calendar')
      .addTag('notifications', 'Notifications')
      .addTag('webhooks', 'Webhook integrations')
      .addTag('content-types', 'Content type management')
      .addTag('rule-engine', 'Rule engine configuration')
      .addTag('upsell', 'Upsell recommendations')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.PORT || 3001;
  await app.listen(port);
  Logger.log(`🚀 BrandBook API running on http://localhost:${port}/api/v1`);
  Logger.log(`📚 Swagger docs at http://localhost:${port}/api/docs`);
}

bootstrap();
