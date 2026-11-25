import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Khoa } from './khoa.entity';
import { Nganh } from './nganh.entity';
import { GiangVien } from './giang-vien.entity';
import { KhoaController } from './khoa.controller';
import { KhoaService } from './khoa.service';

@Module({
  imports: [TypeOrmModule.forFeature([Khoa, Nganh, GiangVien])],
  controllers: [KhoaController],
  providers: [KhoaService],
  exports: [KhoaService],
})
export class KhoaModule {}
