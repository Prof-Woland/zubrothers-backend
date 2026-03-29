import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser'
import { AllExceptionFilter } from './common/filters/allException.filter';
import { AllLogger } from './common/log/logger.log';
import { setupSwagger } from './utils/swagger.utils';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new AllExceptionFilter());
  app.useLogger(new AllLogger);

  setupSwagger(app);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
