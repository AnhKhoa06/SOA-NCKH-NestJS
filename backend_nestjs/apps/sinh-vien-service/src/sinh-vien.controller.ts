import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser, Roles, RolesGuard } from '@app/common';
import type { CurrentUserPayload } from '@app/common';
import { SinhVienService } from './sinh-vien.service';
import { CreateSinhVienDto } from './dto/create-sinh-vien.dto';
import { UpdateSinhVienDto } from './dto/update-sinh-vien.dto';

@UseGuards(RolesGuard)
@Controller('sinh-vien')
export class SinhVienController {
  constructor(private readonly sinhVienService: SinhVienService) {}

  @Roles('QTV')
  @Post()
  create(@Body() data: CreateSinhVienDto) {
    return this.sinhVienService.create(data);
  }

  @Roles('QTV', 'GV')
  @Get()
  findAll() {
    return this.sinhVienService.findAll();
  }

  @Get(':MaSV')
  findOne(
    @Param('MaSV') MaSV: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    if (user.role === 'SV' && user.maDinhDanh !== MaSV) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'KHONG_DU_QUYEN',
        message: 'Chỉ được xem hồ sơ của chính mình',
      });
    }
    return this.sinhVienService.findOne(MaSV);
  }

  @Roles('QTV')
  @Patch(':MaSV')
  update(@Param('MaSV') MaSV: string, @Body() data: UpdateSinhVienDto) {
    return this.sinhVienService.update(MaSV, data);
  }

  @Roles('QTV')
  @Delete(':MaSV')
  remove(@Param('MaSV') MaSV: string) {
    return this.sinhVienService.remove(MaSV);
  }
}
