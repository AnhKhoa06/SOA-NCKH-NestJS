import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Roles, RolesGuard } from '@app/common';
import { NganhService } from './nganh.service';
import { CreateNganhDto } from './dto/create-nganh.dto';
import { UpdateNganhDto } from './dto/update-nganh.dto';
import { QueryNganhDto } from './dto/query-nganh.dto';

@UseGuards(RolesGuard)
@Controller('nganh')
export class NganhController {
  constructor(private readonly service: NganhService) {}

  @Roles('QTV')
  @Post()
  create(@Body() dto: CreateNganhDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query() q: QueryNganhDto) {
    return this.service.findAll(q);
  }

  @Get(':ma')
  findOne(@Param('ma') ma: string) {
    return this.service.findOne(ma);
  }

  @Roles('QTV')
  @Patch(':ma')
  update(@Param('ma') ma: string, @Body() dto: UpdateNganhDto) {
    return this.service.update(ma, dto);
  }

  @Roles('QTV')
  @Delete(':ma')
  remove(@Param('ma') ma: string) {
    return this.service.remove(ma);
  }
}
