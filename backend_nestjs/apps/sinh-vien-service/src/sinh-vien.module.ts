import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SinhVienController } from './sinh-vien.controller';
import { SinhVienService } from './sinh-vien.service';
import { SinhVien } from './sinh-vien.entity';
import { Nganh } from './nganh.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SinhVien, Nganh])],
  controllers: [SinhVienController],
  providers: [SinhVienService],
})
export class SinhVienModule {}
