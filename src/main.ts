/* eslint-disable import/first */
import 'dotenv/config';
import 'source-map-support/register';

import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';


const appPort = process.env.APP_PORT || 3000;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  if (process.env.NODE_ENV === 'development') {
    app.enableCors({
      origin: '*'
    });
  }

  await app.listen(appPort);
}
bootstrap();
