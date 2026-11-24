import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SinhVienBanSao } from '../entities/sinh-vien-ban-sao.entity';
import { DeTaiBanSao } from '../entities/de-tai-ban-sao.entity';
import { DangKyBanSao } from '../entities/dang-ky-ban-sao.entity';
import { KetQuaNghiemThuBanSao } from '../entities/ket-qua-nghiem-thu-ban-sao.entity';
import { ThamGiaHoiDongBanSao } from '../entities/tham-gia-hoi-dong-ban-sao.entity';
import { SuKienDaXuLy } from '../entities/su-kien-da-xu-ly.entity';

export interface BaseEvent<T = any> {
  eventId: string;
  eventType: string;
  version?: number;
  occurredAt?: string;
  producer?: string;
  correlationId?: string;
  data: T;
}

@Injectable()
export class ReportEventService {
  private readonly logger = new Logger(ReportEventService.name);

  constructor(
    @InjectRepository(SinhVienBanSao)
    private readonly svRepo: Repository<SinhVienBanSao>,
    @InjectRepository(DeTaiBanSao)
    private readonly dtRepo: Repository<DeTaiBanSao>,
    @InjectRepository(DangKyBanSao)
    private readonly dkRepo: Repository<DangKyBanSao>,
    @InjectRepository(KetQuaNghiemThuBanSao)
    private readonly ntRepo: Repository<KetQuaNghiemThuBanSao>,
    @InjectRepository(ThamGiaHoiDongBanSao)
    private readonly hdRepo: Repository<ThamGiaHoiDongBanSao>,
    @InjectRepository(SuKienDaXuLy)
    private readonly suKienRepo: Repository<SuKienDaXuLy>,
  ) {}

  async processEvent(event: BaseEvent): Promise<{ success: boolean; message: string }> {
    if (!event || !event.eventId || !event.eventType) {
      return { success: false, message: 'Thiếu thông tin sự kiện (eventId hoặc eventType)' };
    }

    // Kiểm tra Idempotency - không xử lý sự kiện trùng lặp
    const daXuLy = await this.suKienRepo.findOne({ where: { EventId: event.eventId } });
    if (daXuLy) {
      this.logger.warn(`Sự kiện ${event.eventId} (${event.eventType}) đã được xử lý trước đó, bỏ qua.`);
      return { success: true, message: 'Bản lặp - đã xử lý trước đó' };
    }

    const { eventType, data } = event;

    switch (eventType) {
      case 'SinhVienThayDoi':
        await this.handleSinhVienThayDoi(data);
        break;

      case 'DeTaiDuocDeXuat':
      case 'DeTaiDuocDuyet':
      case 'DeTaiCapNhat':
        await this.handleDeTaiEvent(data);
        break;

      case 'DangKyDuocTao':
      case 'DangKyDuocDuyet':
      case 'DangKyBiTuChoi':
      case 'DangKyDaHuy':
        await this.handleDangKyEvent(data);
        break;

      case 'HoiDongDuocLap':
        await this.handleHoiDongEvent(data);
        break;

      case 'KetQuaNghiemThu':
        await this.handleNghiemThuEvent(data);
        break;

      default:
        this.logger.warn(`Loại sự kiện không thuộc danh mục theo dõi của Report Service: ${eventType}`);
        break;
    }

    // Đánh dấu sự kiện đã xử lý thành công
    await this.suKienRepo.save({
      EventId: event.eventId,
      EventType: event.eventType,
    });

    return { success: true, message: `Đã xử lý sự kiện ${eventType}` };
  }

  private async handleSinhVienThayDoi(data: any) {
    if (!data?.maSV) return;
    await this.svRepo.save({
      MaSV: data.maSV,
      HoTen: data.hoTen ?? null,
      Lop: data.lop ?? null,
      MaNganh: data.maNganh ?? null,
      GPA: data.gpa !== undefined ? Number(data.gpa) : null,
      TrangThai: data.trangThai ?? 'HOAT_DONG',
    });
  }

  private async handleDeTaiEvent(data: any) {
    if (!data?.maDeTai) return;
    const existing = await this.dtRepo.findOne({ where: { MaDeTai: data.maDeTai } });
    await this.dtRepo.save({
      MaDeTai: data.maDeTai,
      TenDeTai: data.tenDeTai ?? existing?.TenDeTai ?? `Đề tài #${data.maDeTai}`,
      MaGV: data.maGV ?? existing?.MaGV ?? null,
      MaNganh: data.maNganh ?? existing?.MaNganh ?? null,
      ChiTieu: data.chiTieu !== undefined ? Number(data.chiTieu) : (existing?.ChiTieu ?? 1),
      SoDaDuyet: data.soDaDuyet !== undefined ? Number(data.soDaDuyet) : (existing?.SoDaDuyet ?? 0),
      TrangThai: data.trangThai ?? existing?.TrangThai ?? 'CHO_DUYET',
    });
  }

  private async handleDangKyEvent(data: any) {
    if (!data?.maDangKy) return;
    await this.dkRepo.save({
      MaDangKy: data.maDangKy,
      MaSV: data.maSV,
      MaDeTai: Number(data.maDeTai),
      TrangThai: data.trangThai ?? 'CHO_DUYET',
      NgayDangKy: data.ngayDangKy ? new Date(data.ngayDangKy) : new Date(),
    });

    // Cập nhật lại số đã duyệt cho đề tài nếu có
    if (data.maDeTai) {
      const daDuyetCount = await this.dkRepo.count({
        where: { MaDeTai: Number(data.maDeTai), TrangThai: 'DA_DUYET' },
      });
      const dt = await this.dtRepo.findOne({ where: { MaDeTai: Number(data.maDeTai) } });
      if (dt) {
        dt.SoDaDuyet = daDuyetCount;
        await this.dtRepo.save(dt);
      }
    }
  }

  private async handleHoiDongEvent(data: any) {
    if (!data?.maHoiDong || !Array.isArray(data.thanhVien)) return;
    const ngayHop = data.ngayHop ? new Date(data.ngayHop) : new Date();
    const namHoc = data.namHoc ?? `${ngayHop.getFullYear()}-${ngayHop.getFullYear() + 1}`;

    for (const tv of data.thanhVien) {
      if (!tv?.maGV) continue;
      await this.hdRepo.save({
        MaHoiDong: Number(data.maHoiDong),
        MaGV: tv.maGV,
        VaiTro: tv.vaiTro ?? 'UY_VIEN',
        NgayHop: ngayHop,
        NamHoc: namHoc,
      });
    }
  }

  private async handleNghiemThuEvent(data: any) {
    if (!data?.maDeTai || !data?.maGV) return;
    const ngayNghiemThu = data.ngayNghiemThu ? new Date(data.ngayNghiemThu) : new Date();
    const namHoc = data.namHoc ?? `${ngayNghiemThu.getFullYear()}-${ngayNghiemThu.getFullYear() + 1}`;

    await this.ntRepo.save({
      MaDeTai: Number(data.maDeTai),
      MaGV: data.maGV,
      KetLuan: data.ketLuan ?? 'DAT',
      DiemTB: Number(data.diemTB ?? 0),
      NamHoc: namHoc,
      NgayNghiemThu: ngayNghiemThu,
    });

    // Cập nhật trạng thái đề tài sang DA_NGHIEM_THU nếu Đạt
    if (data.ketLuan === 'DAT') {
      const dt = await this.dtRepo.findOne({ where: { MaDeTai: Number(data.maDeTai) } });
      if (dt) {
        dt.TrangThai = 'DA_NGHIEM_THU';
        await this.dtRepo.save(dt);
      }
    }
  }
}
