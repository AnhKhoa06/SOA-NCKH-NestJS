import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { CurrentUser, Roles } from '@app/common';
import type { CurrentUserPayload } from '@app/common';
import { ReportService } from './report.service';
import { ReportEventService } from './events/report-event.service';
import type { BaseEvent } from './events/report-event.service';

@Controller('bao-cao')
export class ReportController {
  constructor(
    private readonly reportService: ReportService,
    private readonly eventService: ReportEventService,
  ) {}

  // 1. TỔNG QUAN (FR-16) - Mọi vai trò đã đăng nhập
  @Get('tong-quan')
  @Roles('QTV', 'GV', 'SV')
  getTongQuan(@CurrentUser() user: CurrentUserPayload) {
    return this.reportService.getTongQuan(user);
  }

  // 2. THỐNG KÊ ĐỀ TÀI (FR-17) - QTV và GV
  @Get('de-tai')
  @Roles('QTV', 'GV')
  getThongKeDeTai(
    @CurrentUser() user: CurrentUserPayload,
    @Query('maNganh') maNganh?: string,
    @Query('maGV') maGV?: string,
    @Query('trangThai') trangThai?: string,
    @Query('page') page?: string,
    @Query('size') size?: string,
  ) {
    return this.reportService.getThongKeDeTai(user, {
      maNganh,
      maGV,
      trangThai,
      page: page ? Number(page) : undefined,
      size: size ? Number(size) : undefined,
    });
  }

  // 3. THỐNG KÊ SINH VIÊN (FR-18) - Chỉ QTV
  @Get('sinh-vien')
  @Roles('QTV')
  getThongKeSinhVien(
    @CurrentUser() user: CurrentUserPayload,
    @Query('maNganh') maNganh?: string,
    @Query('lop') lop?: string,
    @Query('page') page?: string,
    @Query('size') size?: string,
  ) {
    return this.reportService.getThongKeSinhVien(user, {
      maNganh,
      lop,
      page: page ? Number(page) : undefined,
      size: size ? Number(size) : undefined,
    });
  }

  // 4. QUY ĐỔI GIỜ NCKH (FR-31) - QTV và GV
  @Get('gio-nckh')
  @Roles('QTV', 'GV')
  getGioNckh(
    @CurrentUser() user: CurrentUserPayload,
    @Query('namHoc') namHoc?: string,
    @Query('maGV') maGV?: string,
  ) {
    return this.reportService.getGioNckh(user, namHoc, maGV);
  }

  // 5. XUẤT BÁO CÁO (FR-19) - QTV và GV
  @Get('xuat')
  @Roles('QTV', 'GV')
  async exportReport(
    @CurrentUser() user: CurrentUserPayload,
    @Query('loai') loai: 'de-tai' | 'dang-ky' | 'sinh-vien-chua-dang-ky' | 'gio-nckh',
    @Query('dinhDang') dinhDang?: 'xlsx' | 'csv' | 'json',
    @Query('namHoc') namHoc?: string,
    @Query('maNganh') maNganh?: string,
    @Res() res?: Response,
  ) {
    const result = await this.reportService.exportReport(user, {
      loai: loai || 'de-tai',
      dinhDang,
      namHoc,
      maNganh,
    });

    if (dinhDang === 'csv' && (result as any).content && res) {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${(result as any).filename}"`,
      );
      return res.send((result as any).content);
    }

    if (res) {
      return res.json(result);
    }
    return result;
  }

  // 6. TIẾP NHẬN SỰ KIỆN (B1/B5) - Nhận sự kiện dựng bản sao đọc (Idempotent)
  @Post('su-kien')
  @HttpCode(200)
  processEvent(@Body() event: BaseEvent) {
    return this.eventService.processEvent(event);
  }
}
