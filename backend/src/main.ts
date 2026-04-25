import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { WinstonLogger } from './common/logger/winston.logger';
import { ExpressAdapter } from '@nestjs/platform-express';

async function bootstrap() {
  const adapter = new ExpressAdapter();
  const app = await NestFactory.create(AppModule, adapter, {
    logger: new WinstonLogger(),
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);

  // Note: Helmet removed to fix CSP issues in development

  // CORS configuration
  // Allow all origins for development
  app.enableCors({
    origin: '*',
    credentials: false,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Health check endpoint (outside API prefix)
  const server = adapter.getInstance();
  server.get('/health', (req: any, res: any) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Global prefix
  app.setGlobalPrefix('api/v1');

  await app.listen(port);
  console.log(` Application is running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/v1`);
}

bootstrap();
