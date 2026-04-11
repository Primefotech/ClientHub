import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as express from 'express';
import { Express } from 'express';

let cachedServer: Express;

async function bootstrap(): Promise<Express> {
  if (!cachedServer) {
    const expressApp = express();
    const app = await NestFactory.create(AppModule, new (require('@nestjs/platform-express').ExpressAdapter)(expressApp));
    
    app.setGlobalPrefix('api/v1');
    
    // Minimal CORS for Vercel (Next.js and API on same domain)
    app.enableCors({
      origin: true,
      credentials: true,
    });

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ limit: '50mb', extended: true }));

    await app.init();
    cachedServer = expressApp;
  }
  return cachedServer;
}

export const handler = async (req: any, res: any) => {
  const server = await bootstrap();
  return server(req, res);
};
