import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { Public, Roles } from '@app/common';
import { NhatKyService } from './nhat-ky.service';

@Controller('nhat-ky')
@Roles('QTV')
export class NhatKyController {
  constructor(private readonly svc: NhatKyService) {}

  @Public()
  @Post('noi-bo')
  ghiNoiBo(
    @Body()
    body: {
      nguoiThucHien?: string;
      vaiTro?: string;
      hanhDong: string;
      doiTuong?: string;
      ketQua?: string;
      diaChiIp?: string;
    },
  ) {
    return this.svc.ghiNhatKy(body);
  }

  @Get('bo-loc')
  boLoc() {
    return this.svc.boLoc();
  }

  @Get()
  danhSach(
    @Query('page') page?: string,
    @Query('size') size?: string,
    @Query('tu') tu?: string,
    @Query('den') den?: string,
    @Query('nguoiThucHien') nguoiThucHien?: string,
    @Query('hanhDong') hanhDong?: string,
  ) {
    return this.svc.danhSach({
      page: Number(page),
      size: Number(size),
      tu,
      den,
      nguoiThucHien,
      hanhDong,
    });
  }
}