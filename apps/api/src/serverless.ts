import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupApp } from './setup';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';

const server = express();

export const bootstrap = async () => {
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(server),
    { logger: ['error', 'warn', 'log'] }
  );
  
  // Apply shared setup (CORS, prefix, pipes, etc)
  setupApp(app);
  
  await app.init();
  return server;
};

// Vercel serverless function entry point
export default async (req: any, res: any) => {
  const instance = await bootstrap();
  return instance(req, res);
};
