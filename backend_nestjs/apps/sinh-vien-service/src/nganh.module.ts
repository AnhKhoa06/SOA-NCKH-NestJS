import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Nganh } from './nganh.entity';
import { Khoa } from './khoa.entity';
import { SinhVien } from './sinh-vien.entity';
import { NganhController } from './nganh.controller';
import { NganhService } from './nganh.service';

@Module({
  imports: [TypeOrmModule.forFeature([Nganh, Khoa, SinhVien])],
  controllers: [NganhController],
  providers: [NganhService],
  exports: [NganhService],
})
export class NganhModule {}
