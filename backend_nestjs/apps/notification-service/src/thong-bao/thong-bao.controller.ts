import {
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { CurrentUser, Roles } from '@app/common';
import type { CurrentUserPayload } from '@app/common';
import { ThongBaoService } from './thong-bao.service';

@Controller('thong-bao')
@Roles('QTV', 'GV', 'SV')
export class ThongBaoController {
  constructor(private readonly svc: ThongBaoService) {}

  @Get()
  danhSach(
    @CurrentUser() user: CurrentUserPayload,
    @Query('page') page?: string,
    @Query('size') size?: string,
    @Query('chuaDoc') chuaDoc?: string,
  ) {
    return this.svc.danhSach(user, Number(page), Number(size), chuaDoc);
  }

  // Khai báo trước route có :id
  @Get('so-luong-chua-doc')
  demChuaDoc(@CurrentUser() user: CurrentUserPayload) {
    return this.svc.demChuaDoc(user);
  }

  @HttpCode(200)
  @Patch(':id/da-doc')
  danhDauDaDoc(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.svc.danhDauDaDoc(user, id);
  }
}