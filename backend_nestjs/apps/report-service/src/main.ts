import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ReportServiceModule } from './report-service.module';

async function bootstrap() {
  const app = await NestFactory.create(ReportServiceModule);
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  const port = process.env.PORT ?? 3006;
  await app.listen(port);
  console.log(`Report service đang chạy ở cổng ${port}`);
}
bootstrap();
