import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // CORS
  // In production with Nginx same-domain routing, CORS headers are rarely
  // triggered (browser sees same origin). This config handles direct API
  // access, dev environments, and multi-domain setups.
  //
  // FRONTEND_URL supports comma-separated list:
  //   FRONTEND_URL=https://yourdomain.com,https://www.yourdomain.com
  const rawOrigins = process.env.FRONTEND_URL || 'http://localhost:3000';
  const allowedOrigins = rawOrigins.split(',').map((o) => o.trim()).filter(Boolean);

  app.enableCors({
    origin: (incomingOrigin, callback) => {
      // Allow server-to-server requests (no Origin header) — internal Docker calls
      if (!incomingOrigin) return callback(null, true);
      // Allow wildcard (set FRONTEND_URL=* to open all origins, dev only)
      if (allowedOrigins.includes('*')) return callback(null, true);
      // Allow if origin matches any configured value
      if (allowedOrigins.includes(incomingOrigin)) return callback(null, true);
      // Reject unknown origins
      Logger.warn(`CORS blocked request from: ${incomingOrigin}`);
      return callback(new Error(`CORS policy: origin ${incomingOrigin} is not allowed`), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count'],
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
