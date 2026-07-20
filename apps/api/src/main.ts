import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  /** Only the surfaces in the App Profile: the Expo app and the admin panel. */
  app.enableCors({
    origin: [process.env.ADMIN_URL, process.env.EXPO_PUBLIC_API_URL].filter(
      (o): o is string => typeof o === 'string' && o.length > 0,
    ),
    credentials: true,
  });

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  Logger.log(`API listening on :${port}`, 'Bootstrap');
}

void bootstrap();
