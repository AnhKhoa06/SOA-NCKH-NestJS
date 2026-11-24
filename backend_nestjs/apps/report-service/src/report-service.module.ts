import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from '@app/common';
import { SinhVienBanSao } from './entities/sinh-vien-ban-sao.entity';
import { DeTaiBanSao } from './entities/de-tai-ban-sao.entity';
import { DangKyBanSao } from './entities/dang-ky-ban-sao.entity';
import { KetQuaNghiemThuBanSao } from './entities/ket-qua-nghiem-thu-ban-sao.entity';
import { ThamGiaHoiDongBanSao } from './entities/tham-gia-hoi-dong-ban-sao.entity';
import { SuKienDaXuLy } from './entities/su-kien-da-xu-ly.entity';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { ReportEventService } from './events/report-event.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['apps/report-service/.env', '.env'],
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
    TypeOrmModule.forFeature([
      SinhVienBanSao,
      DeTaiBanSao,
      DangKyBanSao,
      KetQuaNghiemThuBanSao,
      ThamGiaHoiDongBanSao,
      SuKienDaXuLy,
    ]),
    CommonModule,
  ],
  controllers: [ReportController],
  providers: [ReportService, ReportEventService],
  exports: [ReportService, ReportEventService],
})
export class ReportServiceModule {}
