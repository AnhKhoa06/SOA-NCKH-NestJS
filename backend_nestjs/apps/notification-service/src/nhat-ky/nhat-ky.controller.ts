import { Controller, Get, Query } from '@nestjs/common';
import { Roles } from '@app/common';
import { NhatKyService } from './nhat-ky.service';

@Controller('nhat-ky')
@Roles('QTV')
export class NhatKyController {
  constructor(private readonly svc: NhatKyService) {}

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