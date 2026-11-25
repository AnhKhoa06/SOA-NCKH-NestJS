import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GiangVien } from './giang-vien.entity';
import { GiangVienController } from './giang-vien.controller';
import { GiangVienService } from './giang-vien.service';

@Module({
  imports: [TypeOrmModule.forFeature([GiangVien])],
  controllers: [GiangVienController],
  providers: [GiangVienService],
  exports: [GiangVienService],
})
export class GiangVienModule {}
