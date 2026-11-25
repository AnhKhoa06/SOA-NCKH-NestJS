import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeTai } from '../de-tai.entity';
import { HoiDongController } from './hoi-dong.controller';
import { HoiDongService } from './hoi-dong.service';
import { HoiDong } from './hoi-dong.entity';
import { ThanhVienHoiDong } from './thanh-vien-hoi-dong.entity';

@Module({
  imports: [TypeOrmModule.forFeature([HoiDong, ThanhVienHoiDong, DeTai])],
  controllers: [HoiDongController],
  providers: [HoiDongService],
})
export class HoiDongModule {}
