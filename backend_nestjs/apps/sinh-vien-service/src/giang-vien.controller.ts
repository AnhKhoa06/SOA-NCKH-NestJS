import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser, Roles, RolesGuard } from '@app/common';
import type { CurrentUserPayload } from '@app/common';
import { GiangVienService } from './giang-vien.service';
import { CreateGiangVienDto } from './dto/create-giang-vien.dto';
import { UpdateGiangVienDto } from './dto/update-giang-vien.dto';
import { QueryGiangVienDto } from './dto/query-giang-vien.dto';

@UseGuards(RolesGuard)
@Controller('giang-vien')
export class GiangVienController {
  constructor(private readonly service: GiangVienService) {}

  @Roles('QTV')
  @Post()
  create(@Body() dto: CreateGiangVienDto) {
    return this.service.create(dto);
  }

  @Roles('QTV')
  @Get()
  findAll(@Query() q: QueryGiangVienDto) {
    return this.service.findAll(q);
  }

  @Get(':maGV')
  findOne(
    @Param('maGV') maGV: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    if (user.role === 'GV' && user.maDinhDanh !== maGV) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'KHONG_DU_QUYEN',
        message: 'Chỉ được xem hồ sơ của chính mình',
      });
    }
    return this.service.findOne(maGV);
  }

  @Roles('QTV')
  @Patch(':maGV')
  update(@Param('maGV') maGV: string, @Body() dto: UpdateGiangVienDto) {
    return this.service.update(maGV, dto);
  }

  @Roles('QTV')
  @Delete(':maGV')
  remove(@Param('maGV') maGV: string) {
    return this.service.remove(maGV);
  }
}
