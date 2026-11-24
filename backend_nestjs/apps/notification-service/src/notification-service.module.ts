import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from '@app/common';
import { ThongBao } from './thong-bao/thong-bao.entity';
import { ThongBaoController } from './thong-bao/thong-bao.controller';
import { ThongBaoService } from './thong-bao/thong-bao.service';
import { NhatKy } from './nhat-ky/nhat-ky.entity';
import { NhatKyController } from './nhat-ky/nhat-ky.controller';
import { NhatKyService } from './nhat-ky/nhat-ky.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['apps/notification-service/.env', '.env'],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get('DB_HOST'),
        port: Number(config.get('DB_PORT')),
        username: config.get('DB_USER'),
        password: config.get('DB_PASS'),
        database: config.get('DB_NAME'),
        autoLoadEntities: true,
        synchronize: false,
      }),
    }),
    TypeOrmModule.forFeature([ThongBao, NhatKy]),
    CommonModule,
  ],
  controllers: [ThongBaoController, NhatKyController],
  providers: [ThongBaoService, NhatKyService],
})
export class NotificationServiceModule {}