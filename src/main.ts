import { config } from 'dotenv'
config()

import { NestFactory } from '@nestjs/core';
import 'source-map-support/register';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  if (process.env.NODE_ENV === 'development') {
    app.enableCors({
      origin: '*'
    });
  }

  await app.listen(3000);
}
bootstrap();
