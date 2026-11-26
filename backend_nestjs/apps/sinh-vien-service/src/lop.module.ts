import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lop } from './lop.entity';
import { LopController } from './lop.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Lop])],
  controllers: [LopController],
  exports: [TypeOrmModule],
})
export class LopModule {}
