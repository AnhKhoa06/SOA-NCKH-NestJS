import { Controller, Get, Param } from '@nestjs/common';
import { GiangVienService } from './giang-vien.service';

@Controller('giang-vien')
export class GiangVienController {
  constructor(private readonly service: GiangVienService) {}

  @Get(':maGV')
  findOne(@Param('maGV') maGV: string) {
    return this.service.findOne(maGV);
  }
}
