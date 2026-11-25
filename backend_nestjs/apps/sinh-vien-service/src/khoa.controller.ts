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
import { KhoaService } from './khoa.service';
import { CreateKhoaDto } from './dto/create-khoa.dto';
import { UpdateKhoaDto } from './dto/update-khoa.dto';
import { QueryKhoaDto } from './dto/query-khoa.dto';

@UseGuards(RolesGuard)
@Controller('khoa')
export class KhoaController {
  constructor(private readonly service: KhoaService) {}

  @Roles('QTV')
  @Post()
  create(@Body() dto: CreateKhoaDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query() q: QueryKhoaDto) {
    return this.service.findAll(q);
  }

  @Get(':ma')
  findOne(@Param('ma') ma: string) {
    return this.service.findOne(ma);
  }

  @Roles('QTV')
  @Patch(':ma')
  update(@Param('ma') ma: string, @Body() dto: UpdateKhoaDto) {
    return this.service.update(ma, dto);
  }

  @Roles('QTV')
  @Delete(':ma')
  remove(@Param('ma') ma: string) {
    return this.service.remove(ma);
  }
}
