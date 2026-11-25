import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Roles, RolesGuard } from '@app/common';
import { CreateHoiDongDto } from './dto/create-hoi-dong.dto';
import { HoiDongService } from './hoi-dong.service';

@UseGuards(RolesGuard)
@Controller('hoi-dong')
export class HoiDongController {
  constructor(private readonly service: HoiDongService) {}

  @Roles('QTV')
  @Post()
  create(@Body() dto: CreateHoiDongDto) {
    return this.service.create(dto);
  }

  @Roles('QTV', 'GV')
  @Get()
  findAll() {
    return this.service.findAll();
  }
}
