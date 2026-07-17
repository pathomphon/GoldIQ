import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';

import { AppModule } from './app.module';
import type { AppEnvironment } from './config/environment.schema';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService<AppEnvironment, true>);

  app.useLogger(app.get(Logger));
  app.use(helmet());
  app.enableCors({
    origin: config.get('api.corsOrigins', { infer: true }),
    credentials: false,
  });
  app.enableShutdownHooks();
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true,
    }),
  );

  const host = config.get('api.host', { infer: true });
  const port = config.get('api.port', { infer: true });
  await app.listen(port, host);
}

void bootstrap();
