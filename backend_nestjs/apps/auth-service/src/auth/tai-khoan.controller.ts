import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser, Roles } from '@app/common';
import {
  CreateTaiKhoanDto,
  DatLaiMatKhauDto,
  DoiMatKhauDto,
} from './dto/tai-khoan.dto';
import { TaiKhoanService } from './tai-khoan.service';

@Controller('tai-khoan')
@Roles('QTV')
export class TaiKhoanController {
  constructor(private readonly svc: TaiKhoanService) {}

  @Post()
  tao(@Body() dto: CreateTaiKhoanDto, @Headers('authorization') auth?: string) {
    return this.svc.tao(dto, auth);
  }

  @Get()
  danhSach(
    @Query('page') page?: string,
    @Query('size') size?: string,
    @Query('vaiTro') vaiTro?: string,
    @Query('q') q?: string,
  ) {
    return this.svc.danhSach(Number(page), Number(size), vaiTro, q);
  }

  // Mọi vai trò xem được tài khoản của chính mình (khai báo trước các route có :id)
  @Roles('QTV', 'GV', 'SV')
  @Get('me')
  toi(@CurrentUser('sub') sub: string) {
    return this.svc.toi(Number(sub));
  }

  // Mọi vai trò đều cập nhật được email tài khoản của chính mình
  @Roles('QTV', 'GV', 'SV')
  @Patch('me')
  capNhatToi(
    @CurrentUser('sub') sub: string,
    @Body() body: { email?: string },
  ) {
    return this.svc.capNhatEmail(Number(sub), body?.email);
  }

  // Mọi vai trò đều đổi được mật khẩu của chính mình
  @Roles('QTV', 'GV', 'SV')
  @HttpCode(200)
  @Patch('me/mat-khau')
  doiMatKhau(@CurrentUser('sub') sub: string, @Body() dto: DoiMatKhauDto) {
    return this.svc.doiMatKhau(Number(sub), dto.matKhauCu, dto.matKhauMoi);
  }

  @Patch(':id/khoa')
  khoa(@Param('id', ParseIntPipe) id: number, @CurrentUser('sub') sub: string) {
    return this.svc.khoa(id, Number(sub));
  }

  @Patch(':id/mo-khoa')
  moKhoa(@Param('id', ParseIntPipe) id: number) {
    return this.svc.moKhoa(id);
  }

  @Patch(':id/dat-lai-mat-khau')
  datLai(@Param('id', ParseIntPipe) id: number, @Body() dto: DatLaiMatKhauDto) {
    return this.svc.datLaiMatKhau(id, dto.matKhauMoi);
  }
}
