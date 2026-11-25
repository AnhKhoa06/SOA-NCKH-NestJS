import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SinhVienServiceModule } from './sinh-vien-service.module';

async function bootstrap() {
  const app = await NestFactory.create(SinhVienServiceModule);
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  const port = process.env.PORT ?? 3001;

  await app.listen(port);
  console.log(`SinhVien service đang chạy ở cổng ${port}`);
}
bootstrap();
