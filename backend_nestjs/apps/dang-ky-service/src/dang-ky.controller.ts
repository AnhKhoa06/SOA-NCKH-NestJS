import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser, Roles, RolesGuard } from '@app/common';
import type { CurrentUserPayload } from '@app/common';
import { DangKyService } from './dang-ky.service';
import { CreateDangKyDto } from './dto/create-dang-ky.dto';
import { UpdateDangKyDto } from './dto/update-dang-ky.dto';
import { TuChoiDangKyDto } from './dto/tu-choi-dang-ky.dto';

// Mã sinh viên của người đang thao tác luôn lấy từ token
function maSVTuToken(user: CurrentUserPayload): string {
  if (!user?.maDinhDanh) {
    throw new ForbiddenException({
      statusCode: 403,
      code: 'KHONG_DU_QUYEN',
      message: 'Tài khoản không gắn với mã sinh viên',
    });
  }
  return user.maDinhDanh;
}

function maGVTuToken(user: CurrentUserPayload): string {
  if (!user?.maDinhDanh) {
    throw new ForbiddenException({
      statusCode: 403,
      code: 'KHONG_DU_QUYEN',
      message: 'Tài khoản không gắn với mã giảng viên',
    });
  }
  return user.maDinhDanh;
}

// RolesGuard gắn tường minh để dịch vụ tự kiểm tra lại quyền, không phụ thuộc Gateway
@UseGuards(RolesGuard)
@Controller('dang-ky')
export class DangKyController {
  constructor(private readonly service: DangKyService) {}

  // B3 (FR-10): sinh viên đăng ký, mã SV lấy từ token
  @Roles('SV')
  @Post()
  create(
    @Body() dto: CreateDangKyDto,
    @CurrentUser() user: CurrentUserPayload,
    @Headers('authorization') auth: string,
  ) {
    return this.service.create(maSVTuToken(user), dto.maDeTai, auth);
  }

  // B4 (FR-12): sinh viên hủy đăng ký của mình khi còn CHO_DUYET
  @Roles('SV')
  @Patch(':id/huy')
  huy(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.huy(id, maSVTuToken(user));
  }

  // B5 (FR-13): giảng viên phụ trách duyệt
  @Roles('GV')
  @Patch(':id/duyet')
  duyet(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserPayload,
    @Headers('authorization') auth: string,
  ) {
    return this.service.duyet(id, maGVTuToken(user), auth);
  }

  // B5 (FR-13): giảng viên phụ trách từ chối, bắt buộc có lý do
  @Roles('GV')
  @Patch(':id/tu-choi')
  tuChoi(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: TuChoiDangKyDto,
    @CurrentUser() user: CurrentUserPayload,
    @Headers('authorization') auth: string,
  ) {
    return this.service.tuChoi(id, maGVTuToken(user), dto.lyDo, auth);
  }

  // B6 sẽ lọc theo vai trò
  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  // Sửa trực tiếp và xóa cứng chỉ còn cho QTV (khớp luật Gateway)
  @Roles('QTV')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDangKyDto,
    @Headers('authorization') auth: string,
  ) {
    return this.service.update(id, dto, auth);
  }

  @Roles('QTV')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
