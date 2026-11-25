import { Controller, Get, Param } from '@nestjs/common';
import { NganhService } from './nganh.service';

@Controller('nganh')
export class NganhController {
  constructor(private readonly service: NganhService) {}

  @Get(':ma')
  findOne(@Param('ma') ma: string) {
    return this.service.findOne(ma);
  }
}
