import {
  ForbiddenException,
  Injectable,
  Logger,
  PayloadTooLargeException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import type { CurrentUserPayload } from '@app/common';
import { SinhVienBanSao } from './entities/sinh-vien-ban-sao.entity';
import { DeTaiBanSao } from './entities/de-tai-ban-sao.entity';
import { DangKyBanSao } from './entities/dang-ky-ban-sao.entity';
import { KetQuaNghiemThuBanSao } from './entities/ket-qua-nghiem-thu-ban-sao.entity';
import { ThamGiaHoiDongBanSao } from './entities/tham-gia-hoi-dong-ban-sao.entity';

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);

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
    private readonly config: ConfigService,
  ) {}

  private async fetchJson<T = any>(url: string, auth?: string): Promise<T | null> {
    try {
      const res = await fetch(url, {
        headers: auth ? { Authorization: auth } : {},
        signal: AbortSignal.timeout(2500),
      });
      if (!res.ok) return null;
      return (await res.json()) as T;
    } catch {
      return null;
    }
  }

  // =========================================================================
  // 1. TỔNG QUAN (FR-16)
  // =========================================================================
  async getTongQuan(user: CurrentUserPayload, auth?: string) {
    const role = user.role;
    const academicUrl = this.config.get<string>('ACADEMIC_URL', 'http://localhost:3001');
    const deTaiUrl = this.config.get<string>('DETAI_URL', 'http://localhost:3002/de-tai');
    const dangKyUrl = this.config.get<string>('DANGKY_URL', 'http://localhost:3003/dang-ky');

    try {
      if (role === 'QTV') {
        const [tongSinhVien, tongDeTai, deTaiList, dangKyList, hdList] = await Promise.all([
          this.svRepo.count({ where: { TrangThai: 'HOAT_DONG' } }),
          this.dtRepo.count(),
          this.dtRepo.find(),
          this.dkRepo.find(),
          this.hdRepo.find(),
        ]);

        // Nếu bản sao đọc chưa có dữ liệu sự kiện, lấy trực tiếp từ các dịch vụ nguồn
        if (tongSinhVien === 0 && tongDeTai === 0 && dangKyList.length === 0) {
          const [svRes, gvRes, dtRes, dkRes] = await Promise.all([
            this.fetchJson<any>(`${academicUrl}/sinh-vien?size=1`, auth),
            this.fetchJson<any>(`${academicUrl}/giang-vien?size=1`, auth),
            this.fetchJson<any>(deTaiUrl, auth),
            this.fetchJson<any>(`${dangKyUrl}?size=100`, auth),
          ]);
          const topics: any[] = Array.isArray(dtRes) ? dtRes : (dtRes?.data ?? []);
          const regs: any[] = Array.isArray(dkRes) ? dkRes : (dkRes?.data ?? []);
          const deTaiTheoTrangThai: Record<string, number> = {};
          let tongChiTieu = 0;
          for (const dt of topics) {
            const st = dt.trangThai || 'DANG_MO';
            deTaiTheoTrangThai[st] = (deTaiTheoTrangThai[st] || 0) + 1;
            tongChiTieu += Number(dt.soLuongToiDa ?? dt.chiTieu ?? 0);
          }
          const dangKyTheoTrangThai: Record<string, number> = {};
          for (const dk of regs) {
            const st = dk.trangThai || 'CHO_DUYET';
            dangKyTheoTrangThai[st] = (dangKyTheoTrangThai[st] || 0) + 1;
          }
          const tongDaDuyet = dangKyTheoTrangThai['DA_DUYET'] || 0;
          const tyLeLapDayChung =
            tongChiTieu > 0 ? Number(((tongDaDuyet / tongChiTieu) * 100).toFixed(1)) : 0;

          return {
            role: 'QTV',
            tongSinhVien: svRes?.total ?? (Array.isArray(svRes) ? svRes.length : 0),
            tongGiangVien: gvRes?.total ?? (Array.isArray(gvRes) ? gvRes.length : 0),
            tongDeTai: topics.length,
            tongChiTieu,
            tongDaDuyet,
            tyLeLapDayChung,
            deTaiTheoTrangThai,
            dangKyTheoTrangThai,
            soDeTaiChoDuyet: deTaiTheoTrangThai['CHO_DUYET'] || 0,
            soDangKyChoDuyet: dangKyTheoTrangThai['CHO_DUYET'] || 0,
          };
        }

        const deTaiTheoTrangThai: Record<string, number> = {};
        const gvSet = new Set<string>();
        let tongChiTieu = 0;
        let tongDaDuyet = 0;

        for (const dt of deTaiList) {
          deTaiTheoTrangThai[dt.TrangThai] = (deTaiTheoTrangThai[dt.TrangThai] || 0) + 1;
          if (dt.MaGV) gvSet.add(dt.MaGV);
          tongChiTieu += dt.ChiTieu || 0;
          tongDaDuyet += dt.SoDaDuyet || 0;
        }

        const dangKyTheoTrangThai: Record<string, number> = {};
        for (const dk of dangKyList) {
          dangKyTheoTrangThai[dk.TrangThai] = (dangKyTheoTrangThai[dk.TrangThai] || 0) + 1;
        }

        for (const hd of hdList) {
          if (hd.MaGV) gvSet.add(hd.MaGV);
        }

        const tyLeLapDayChung =
          tongChiTieu > 0 ? Number(((tongDaDuyet / tongChiTieu) * 100).toFixed(1)) : 0;

        return {
          role: 'QTV',
          tongSinhVien,
          tongGiangVien: gvSet.size,
          tongDeTai,
          tongChiTieu,
          tongDaDuyet,
          tyLeLapDayChung,
          deTaiTheoTrangThai,
          dangKyTheoTrangThai,
          soDeTaiChoDuyet: deTaiTheoTrangThai['CHO_DUYET'] || 0,
          soDangKyChoDuyet: dangKyTheoTrangThai['CHO_DUYET'] || 0,
        };
      }

      if (role === 'GV') {
        const maGV = user.maDinhDanh || '';
        const deTaiCuaToi = await this.dtRepo.find({ where: { MaGV: maGV } });

        if (deTaiCuaToi.length === 0 && maGV) {
          const [dtRes, dkRes] = await Promise.all([
            this.fetchJson<any>(`${deTaiUrl}?maGV=${encodeURIComponent(maGV)}`, auth),
            this.fetchJson<any>(`${dangKyUrl}?size=100`, auth),
          ]);
          const topics: any[] = Array.isArray(dtRes) ? dtRes : (dtRes?.data ?? []);
          const regs: any[] = Array.isArray(dkRes) ? dkRes : (dkRes?.data ?? []);
          const deTaiTheoTrangThai: Record<string, number> = {};
          let tongChiTieu = 0;
          for (const dt of topics) {
            const st = dt.trangThai || 'DANG_MO';
            deTaiTheoTrangThai[st] = (deTaiTheoTrangThai[st] || 0) + 1;
            tongChiTieu += Number(dt.soLuongToiDa ?? dt.chiTieu ?? 0);
          }
          const dangKyTheoTrangThai: Record<string, number> = {};
          for (const dk of regs) {
            const st = dk.trangThai || 'CHO_DUYET';
            dangKyTheoTrangThai[st] = (dangKyTheoTrangThai[st] || 0) + 1;
          }
          const tongDaDuyet = dangKyTheoTrangThai['DA_DUYET'] || 0;
          const tyLeLapDay =
            tongChiTieu > 0 ? Number(((tongDaDuyet / tongChiTieu) * 100).toFixed(1)) : 0;

          return {
            role: 'GV',
            maGV,
            soDeTaiCuaToi: topics.length,
            tongChiTieu,
            tongDaDuyet,
            tyLeLapDay,
            deTaiTheoTrangThai,
            dangKyTheoTrangThai,
            soDangKyChoDuyet: dangKyTheoTrangThai['CHO_DUYET'] || 0,
            tongDangKy: regs.length,
            soDeTaiDat: 0,
            soHoiDongThamGia: 0,
          };
        }

        const maDeTaiIds = deTaiCuaToi.map((d) => d.MaDeTai);

        const deTaiTheoTrangThai: Record<string, number> = {};
        let tongChiTieu = 0;
        let tongDaDuyet = 0;

        for (const dt of deTaiCuaToi) {
          deTaiTheoTrangThai[dt.TrangThai] = (deTaiTheoTrangThai[dt.TrangThai] || 0) + 1;
          tongChiTieu += dt.ChiTieu || 0;
          tongDaDuyet += dt.SoDaDuyet || 0;
        }

        let dangKyCuaToi: DangKyBanSao[] = [];
        if (maDeTaiIds.length > 0) {
          dangKyCuaToi = await this.dkRepo.find({ where: { MaDeTai: In(maDeTaiIds) } });
        }

        const dangKyTheoTrangThai: Record<string, number> = {};
        for (const dk of dangKyCuaToi) {
          dangKyTheoTrangThai[dk.TrangThai] = (dangKyTheoTrangThai[dk.TrangThai] || 0) + 1;
        }

        const tyLeLapDay =
          tongChiTieu > 0 ? Number(((tongDaDuyet / tongChiTieu) * 100).toFixed(1)) : 0;

        const soDeTaiDat = await this.ntRepo.count({
          where: { MaGV: maGV, KetLuan: 'DAT' },
        });
        const soHoiDong = await this.hdRepo.count({ where: { MaGV: maGV } });

        return {
          role: 'GV',
          maGV,
          soDeTaiCuaToi: deTaiCuaToi.length,
          tongChiTieu,
          tongDaDuyet,
          tyLeLapDay,
          deTaiTheoTrangThai,
          dangKyTheoTrangThai,
          soDangKyChoDuyet: dangKyTheoTrangThai['CHO_DUYET'] || 0,
          tongDangKy: dangKyCuaToi.length,
          soDeTaiDat,
          soHoiDongThamGia: soHoiDong,
        };
      }

      if (role === 'SV') {
        const maSV = user.maDinhDanh || '';
        const sv = maSV
          ? await this.svRepo.findOne({ where: { MaSV: maSV } })
          : null;
        const dangKy = maSV
          ? await this.dkRepo.findOne({
              where: { MaSV: maSV },
              order: { NgayDangKy: 'DESC' },
            })
          : null;

        if (!sv && !dangKy && maSV) {
          const [svLive, dkRes, dtRes] = await Promise.all([
            this.fetchJson<any>(`${academicUrl}/sinh-vien/${encodeURIComponent(maSV)}`, auth),
            this.fetchJson<any>(`${dangKyUrl}?size=10`, auth),
            this.fetchJson<any>(deTaiUrl, auth),
          ]);
          const regs: any[] = Array.isArray(dkRes) ? dkRes : (dkRes?.data ?? []);
          const topics: any[] = Array.isArray(dtRes) ? dtRes : (dtRes?.data ?? []);
          const latest = regs[0] || null;
          const matchedTopic = latest
            ? topics.find((t) => Number(t.maDeTai) === Number(latest.maDeTai))
            : null;
          const openTopics = topics.filter((t) => !t.trangThai || t.trangThai === 'DANG_MO');

          return {
            role: 'SV',
            maSV,
            hoTen: svLive?.hoTen || user.username,
            lop: svLive?.lop || null,
            maNganh: svLive?.maNganh || null,
            gpa: svLive?.gpa ?? null,
            trangThaiDangKy: latest ? latest.trangThai : 'CHUA_DANG_KY',
            dangKyHienTai: latest
              ? {
                  maDangKy: latest.maDangKy,
                  maDeTai: latest.maDeTai,
                  tenDeTai:
                    latest.tenDeTai ||
                    matchedTopic?.tenDeTai ||
                    `Đề tài #${latest.maDeTai}`,
                  maGV: matchedTopic?.giangVienHuongDan || matchedTopic?.maGV || null,
                  trangThai: latest.trangThai,
                  ngayDangKy: latest.ngayDangKy,
                }
              : null,
            soDeTaiDangMoPhuHopNganh: openTopics.length,
          };
        }

        let thongTinDeTai: DeTaiBanSao | null = null;
        if (dangKy?.MaDeTai) {
          thongTinDeTai = await this.dtRepo.findOne({ where: { MaDeTai: dangKy.MaDeTai } });
        }

        // Đề tài đang mở phù hợp ngành của sinh viên
        const deTaiDangMoQuery = this.dtRepo
          .createQueryBuilder('dt')
          .where('dt.TrangThai = :st', { st: 'DANG_MO' });

        if (sv?.MaNganh) {
          deTaiDangMoQuery.andWhere('(dt.MaNganh = :nganh OR dt.MaNganh IS NULL)', {
            nganh: sv.MaNganh,
          });
        }

        const soDeTaiDangMoPhuHopNganh = await deTaiDangMoQuery.getCount();

        return {
          role: 'SV',
          maSV,
          hoTen: sv?.HoTen || user.username,
          lop: sv?.Lop || null,
          maNganh: sv?.MaNganh || null,
          gpa: sv?.GPA || null,
          trangThaiDangKy: dangKy ? dangKy.TrangThai : 'CHUA_DANG_KY',
          dangKyHienTai: dangKy
            ? {
                maDangKy: dangKy.MaDangKy,
                maDeTai: dangKy.MaDeTai,
                tenDeTai: thongTinDeTai?.TenDeTai || `Đề tài #${dangKy.MaDeTai}`,
                maGV: thongTinDeTai?.MaGV || null,
                trangThai: dangKy.TrangThai,
                ngayDangKy: dangKy.NgayDangKy,
              }
            : null,
          soDeTaiDangMoPhuHopNganh,
        };
      }

      return { role, message: 'Vai trò không được hỗ trợ' };
    } catch (error) {
      this.logger.error(
        `Lỗi getTongQuan (${role}): ${error instanceof Error ? error.message : error}`,
      );
      if (role === 'QTV') {
        return {
          role: 'QTV',
          tongSinhVien: 0,
          tongGiangVien: 0,
          tongDeTai: 0,
          tongChiTieu: 0,
          tongDaDuyet: 0,
          tyLeLapDayChung: 0,
          deTaiTheoTrangThai: {},
          dangKyTheoTrangThai: {},
          soDeTaiChoDuyet: 0,
          soDangKyChoDuyet: 0,
        };
      }
      if (role === 'GV') {
        return {
          role: 'GV',
          maGV: user.maDinhDanh || '',
          soDeTaiCuaToi: 0,
          tongChiTieu: 0,
          tongDaDuyet: 0,
          tyLeLapDay: 0,
          deTaiTheoTrangThai: {},
          dangKyTheoTrangThai: {},
          soDangKyChoDuyet: 0,
          tongDangKy: 0,
          soDeTaiDat: 0,
          soHoiDongThamGia: 0,
        };
      }
      return {
        role: 'SV',
        maSV: user.maDinhDanh || '',
        hoTen: user.username,
        lop: null,
        maNganh: null,
        gpa: null,
        trangThaiDangKy: 'CHUA_DANG_KY',
        dangKyHienTai: null,
        soDeTaiDangMoPhuHopNganh: 0,
      };
    }
  }

  // =========================================================================
  // 2. THỐNG KÊ ĐỀ TÀI (FR-17)
  // =========================================================================
  async getThongKeDeTai(
    user: CurrentUserPayload,
    filter: { maNganh?: string; maGV?: string; trangThai?: string; page?: number; size?: number },
    auth?: string,
  ) {
    const qb = this.dtRepo.createQueryBuilder('dt');

    // Giảng viên chỉ được xem đề tài của chính mình (BR-08 / FR-17)
    if (user.role === 'GV') {
      qb.andWhere('dt.MaGV = :myGV', { myGV: user.maDinhDanh });
    } else if (filter.maGV) {
      qb.andWhere('dt.MaGV = :filterGV', { filterGV: filter.maGV });
    }

    if (filter.maNganh) {
      qb.andWhere('dt.MaNganh = :nganh', { nganh: filter.maNganh });
    }

    if (filter.trangThai) {
      qb.andWhere('dt.TrangThai = :st', { st: filter.trangThai });
    }

    let allMatched = await qb.orderBy('dt.MaDeTai', 'DESC').getMany();

    // Nếu bản sao đọc chưa có dữ liệu sự kiện, tổng hợp trực tiếp từ Topic + Registration
    if (allMatched.length === 0 && (await this.dtRepo.count()) === 0) {
      const deTaiUrl = this.config.get<string>('DETAI_URL', 'http://localhost:3002/de-tai');
      const dangKyUrl = this.config.get<string>('DANGKY_URL', 'http://localhost:3003/dang-ky');
      const topicQuery =
        user.role === 'GV' && user.maDinhDanh
          ? `${deTaiUrl}?maGV=${encodeURIComponent(user.maDinhDanh)}`
          : deTaiUrl;
      const [dtRes, dkRes] = await Promise.all([
        this.fetchJson<any>(topicQuery, auth),
        this.fetchJson<any>(`${dangKyUrl}?size=100`, auth),
      ]);
      const topics: any[] = Array.isArray(dtRes) ? dtRes : (dtRes?.data ?? []);
      const regs: any[] = Array.isArray(dkRes) ? dkRes : (dkRes?.data ?? []);
      const approvedByTopic = new Map<number, number>();
      for (const dk of regs) {
        if (dk.trangThai === 'DA_DUYET') {
          approvedByTopic.set(Number(dk.maDeTai), (approvedByTopic.get(Number(dk.maDeTai)) || 0) + 1);
        }
      }
      allMatched = topics
        .filter((dt) => {
          if (user.role === 'GV' && user.maDinhDanh && (dt.maGV || '').toUpperCase() !== user.maDinhDanh.toUpperCase()) {
            return false;
          }
          if (filter.maGV && (dt.maGV || '').toUpperCase() !== filter.maGV.trim().toUpperCase()) {
            return false;
          }
          if (filter.maNganh && dt.maNganh !== filter.maNganh) return false;
          const st = dt.trangThai || 'DANG_MO';
          if (filter.trangThai && st !== filter.trangThai) return false;
          return true;
        })
        .map((dt) => ({
          MaDeTai: dt.maDeTai,
          TenDeTai: dt.tenDeTai,
          MaGV: dt.maGV || null,
          MaNganh: dt.maNganh || null,
          ChiTieu: Number(dt.soLuongToiDa ?? dt.chiTieu ?? 1),
          SoDaDuyet: approvedByTopic.get(Number(dt.maDeTai)) || 0,
          TrangThai: dt.trangThai || 'DANG_MO',
          NgayCapNhat: new Date(),
        })) as DeTaiBanSao[];
    }

    // Tính toán số liệu thống kê
    let tongChiTieu = 0;
    let tongDaDuyet = 0;
    const deTaiChuaCoSinhVien: DeTaiBanSao[] = [];
    const theoNganhMap: Record<string, { soDeTai: number; chiTieu: number; soDaDuyet: number }> = {};
    const theoGvMap: Record<string, { soDeTai: number; chiTieu: number; soDaDuyet: number }> = {};

    const formattedData = allMatched.map((dt) => {
      tongChiTieu += dt.ChiTieu || 0;
      tongDaDuyet += dt.SoDaDuyet || 0;

      if ((dt.SoDaDuyet || 0) === 0) {
        deTaiChuaCoSinhVien.push(dt);
      }

      const nganh = dt.MaNganh || 'CHUA_PHAN_NGANH';
      if (!theoNganhMap[nganh]) {
        theoNganhMap[nganh] = { soDeTai: 0, chiTieu: 0, soDaDuyet: 0 };
      }
      theoNganhMap[nganh].soDeTai += 1;
      theoNganhMap[nganh].chiTieu += dt.ChiTieu || 0;
      theoNganhMap[nganh].soDaDuyet += dt.SoDaDuyet || 0;

      const gv = dt.MaGV || 'CHUA_GAN';
      if (!theoGvMap[gv]) {
        theoGvMap[gv] = { soDeTai: 0, chiTieu: 0, soDaDuyet: 0 };
      }
      theoGvMap[gv].soDeTai += 1;
      theoGvMap[gv].chiTieu += dt.ChiTieu || 0;
      theoGvMap[gv].soDaDuyet += dt.SoDaDuyet || 0;

      const tyLeLapDay =
        dt.ChiTieu > 0 ? Number(((dt.SoDaDuyet / dt.ChiTieu) * 100).toFixed(1)) : 0;

      return {
        maDeTai: dt.MaDeTai,
        tenDeTai: dt.TenDeTai,
        maGV: dt.MaGV,
        maNganh: dt.MaNganh,
        chiTieu: dt.ChiTieu,
        soDaDuyet: dt.SoDaDuyet,
        soChoTrong: Math.max(0, dt.ChiTieu - dt.SoDaDuyet),
        tyLeLapDay,
        trangThai: dt.TrangThai,
        ngayCapNhat: dt.NgayCapNhat,
      };
    });

    const tyLeLapDayTrungBinh =
      tongChiTieu > 0 ? Number(((tongDaDuyet / tongChiTieu) * 100).toFixed(1)) : 0;

    // Phân trang
    const page = Math.max(1, filter.page || 1);
    const size = Math.min(100, Math.max(1, filter.size || 20));
    const offset = (page - 1) * size;
    const paginatedData = formattedData.slice(offset, offset + size);

    return {
      data: paginatedData,
      total: formattedData.length,
      page,
      size,
      totalPages: Math.ceil(formattedData.length / size) || 1,
      tongChiTieu,
      tongDaDuyet,
      tyLeLapDayTrungBinh,
      soDeTaiChuaCoSinhVien: deTaiChuaCoSinhVien.length,
      thongKeTheoNganh: Object.entries(theoNganhMap).map(([nganh, v]) => ({
        maNganh: nganh,
        ...v,
        tyLeLapDay: v.chiTieu > 0 ? Number(((v.soDaDuyet / v.chiTieu) * 100).toFixed(1)) : 0,
      })),
      thongKeTheoGiangVien: Object.entries(theoGvMap).map(([gv, v]) => ({
        maGV: gv,
        ...v,
        tyLeLapDay: v.chiTieu > 0 ? Number(((v.soDaDuyet / v.chiTieu) * 100).toFixed(1)) : 0,
      })),
    };
  }

  // =========================================================================
  // 3. THỐNG KÊ SINH VIÊN (FR-18, QTV)
  // =========================================================================
  async getThongKeSinhVien(
    user: CurrentUserPayload,
    filter: { maNganh?: string; lop?: string; page?: number; size?: number },
    auth?: string,
  ) {
    if (user.role !== 'QTV') {
      throw new ForbiddenException('Chỉ Quản trị viên mới có quyền xem thống kê sinh viên');
    }

    const qb = this.svRepo
      .createQueryBuilder('sv')
      .where('sv.TrangThai = :st', { st: 'HOAT_DONG' });

    if (filter.maNganh) {
      qb.andWhere('sv.MaNganh = :nganh', { nganh: filter.maNganh });
    }
    if (filter.lop) {
      qb.andWhere('sv.Lop = :lop', { lop: filter.lop });
    }

    let allStudents = await qb.orderBy('sv.MaSV', 'ASC').getMany();

    // Lấy danh sách đăng ký còn hiệu lực (CHO_DUYET, DA_DUYET)
    let activeRegistrations = await this.dkRepo.find({
      where: { TrangThai: In(['CHO_DUYET', 'DA_DUYET']) },
    });

    if (allStudents.length === 0 && (await this.svRepo.count()) === 0) {
      const academicUrl = this.config.get<string>('ACADEMIC_URL', 'http://localhost:3001');
      const dangKyUrl = this.config.get<string>('DANGKY_URL', 'http://localhost:3003/dang-ky');
      const [svRes, dkRes] = await Promise.all([
        this.fetchJson<any>(`${academicUrl}/sinh-vien?size=100`, auth),
        this.fetchJson<any>(`${dangKyUrl}?size=100`, auth),
      ]);
      const svList: any[] = Array.isArray(svRes) ? svRes : (svRes?.data ?? []);
      const dkList: any[] = Array.isArray(dkRes) ? dkRes : (dkRes?.data ?? []);
      allStudents = svList
        .filter((sv) => {
          if (filter.maNganh && sv.maNganh !== filter.maNganh) return false;
          if (filter.lop && sv.lop !== filter.lop) return false;
          return true;
        })
        .map((sv) => ({
          MaSV: sv.maSV || sv.MaSV,
          HoTen: sv.hoTen,
          Lop: sv.lop || null,
          MaNganh: sv.maNganh || null,
          GPA: sv.gpa ?? null,
          TrangThai: sv.trangThai || 'HOAT_DONG',
          NgayCapNhat: new Date(),
        })) as SinhVienBanSao[];
      activeRegistrations = dkList
        .filter((dk) => dk.trangThai === 'CHO_DUYET' || dk.trangThai === 'DA_DUYET')
        .map((dk) => ({
          MaDangKy: dk.maDangKy,
          MaSV: dk.maSV,
          MaDeTai: dk.maDeTai,
          TrangThai: dk.trangThai,
          NgayDangKy: dk.ngayDangKy,
          NgayCapNhat: new Date(),
        })) as DangKyBanSao[];
    }
    const dkMap = new Map<string, DangKyBanSao>();
    for (const dk of activeRegistrations) {
      dkMap.set(dk.MaSV, dk);
    }

    const danhSachChuaDangKy: any[] = [];
    const theoNganhMap: Record<string, { tongSV: number; daDangKy: number; chuaDangKy: number }> = {};
    const theoLopMap: Record<string, { tongSV: number; daDangKy: number; chuaDangKy: number }> = {};

    let soDaDangKy = 0;
    let soChuaDangKy = 0;

    for (const sv of allStudents) {
      const isRegistered = dkMap.has(sv.MaSV);
      if (isRegistered) {
        soDaDangKy++;
      } else {
        soChuaDangKy++;
        danhSachChuaDangKy.push({
          maSV: sv.MaSV,
          hoTen: sv.HoTen,
          lop: sv.Lop,
          maNganh: sv.MaNganh,
          gpa: sv.GPA,
          trangThai: sv.TrangThai,
        });
      }

      const nganh = sv.MaNganh || 'CHUA_PHAN_NGANH';
      if (!theoNganhMap[nganh]) {
        theoNganhMap[nganh] = { tongSV: 0, daDangKy: 0, chuaDangKy: 0 };
      }
      theoNganhMap[nganh].tongSV += 1;
      if (isRegistered) theoNganhMap[nganh].daDangKy += 1;
      else theoNganhMap[nganh].chuaDangKy += 1;

      const lop = sv.Lop || 'CHUA_PHAN_LOP';
      if (!theoLopMap[lop]) {
        theoLopMap[lop] = { tongSV: 0, daDangKy: 0, chuaDangKy: 0 };
      }
      theoLopMap[lop].tongSV += 1;
      if (isRegistered) theoLopMap[lop].daDangKy += 1;
      else theoLopMap[lop].chuaDangKy += 1;
    }

    const tyLeDaDangKy =
      allStudents.length > 0
        ? Number(((soDaDangKy / allStudents.length) * 100).toFixed(1))
        : 0;

    // Phân trang danh sách chưa đăng ký
    const page = Math.max(1, filter.page || 1);
    const size = Math.min(100, Math.max(1, filter.size || 20));
    const offset = (page - 1) * size;
    const paginatedChuaDangKy = danhSachChuaDangKy.slice(offset, offset + size);

    return {
      tongSinhVien: allStudents.length,
      soDaDangKy,
      soChuaDangKy,
      tyLeDaDangKy,
      thongKeTheoNganh: Object.entries(theoNganhMap).map(([nganh, v]) => ({
        maNganh: nganh,
        ...v,
        tyLeDaDangKy: v.tongSV > 0 ? Number(((v.daDangKy / v.tongSV) * 100).toFixed(1)) : 0,
      })),
      thongKeTheoLop: Object.entries(theoLopMap).map(([lop, v]) => ({
        lop,
        ...v,
        tyLeDaDangKy: v.tongSV > 0 ? Number(((v.daDangKy / v.tongSV) * 100).toFixed(1)) : 0,
      })),
      danhSachChuaDangKy: paginatedChuaDangKy,
      totalChuaDangKy: danhSachChuaDangKy.length,
      page,
      size,
      totalPages: Math.ceil(danhSachChuaDangKy.length / size) || 1,
    };
  }

  // =========================================================================
  // 4. QUY ĐỔI GIỜ NCKH (FR-31)
  // =========================================================================
  async getGioNckh(
    user: CurrentUserPayload,
    namHoc?: string,
    maGVQuery?: string,
  ) {
    let targetMaGV = maGVQuery;

    if (user.role === 'GV') {
      // Giảng viên chỉ xem được của chính mình (FR-31 / 403 nếu cố tình xem người khác)
      if (maGVQuery && maGVQuery !== user.maDinhDanh) {
        throw new ForbiddenException('Giảng viên chỉ có quyền xem giờ NCKH của chính mình');
      }
      targetMaGV = user.maDinhDanh;
    }

    const hoursGuide = Number(this.config.get('HOURS_GUIDE') ?? 30);
    const hoursCouncil = Number(this.config.get('HOURS_COUNCIL') ?? 3);

    // Truy vấn kết quả nghiệm thu đạt
    const ntQb = this.ntRepo
      .createQueryBuilder('nt')
      .where('nt.KetLuan = :kl', { kl: 'DAT' });

    if (targetMaGV) {
      ntQb.andWhere('nt.MaGV = :gv', { gv: targetMaGV });
    }
    if (namHoc) {
      ntQb.andWhere('nt.NamHoc = :nh', { nh: namHoc });
    }

    const ketQuaDat = await ntQb.getMany();

    // Lấy thông tin tên đề tài bổ sung
    const deTaiIds = ketQuaDat.map((k) => k.MaDeTai);
    const deTaiMap = new Map<number, DeTaiBanSao>();
    if (deTaiIds.length > 0) {
      const dtList = await this.dtRepo.find({ where: { MaDeTai: In(deTaiIds) } });
      for (const dt of dtList) deTaiMap.set(dt.MaDeTai, dt);
    }

    // Truy vấn tham gia hội đồng
    const hdQb = this.hdRepo.createQueryBuilder('hd');
    if (targetMaGV) {
      hdQb.andWhere('hd.MaGV = :gv', { gv: targetMaGV });
    }
    if (namHoc) {
      hdQb.andWhere('hd.NamHoc = :nh', { nh: namHoc });
    }

    const thamGiaHd = await hdQb.getMany();

    // Gom dữ liệu theo Giảng viên
    const gvDataMap = new Map<
      string,
      {
        maGV: string;
        danhSachDeTaiDat: any[];
        danhSachHoiDong: any[];
      }
    >();

    const ensureGv = (gv: string) => {
      if (!gvDataMap.has(gv)) {
        gvDataMap.set(gv, {
          maGV: gv,
          danhSachDeTaiDat: [],
          danhSachHoiDong: [],
        });
      }
      return gvDataMap.get(gv)!;
    };

    for (const kq of ketQuaDat) {
      const gvObj = ensureGv(kq.MaGV);
      const dt = deTaiMap.get(kq.MaDeTai);
      gvObj.danhSachDeTaiDat.push({
        maDeTai: kq.MaDeTai,
        tenDeTai: dt?.TenDeTai || `Đề tài #${kq.MaDeTai}`,
        diemTB: kq.DiemTB,
        namHoc: kq.NamHoc,
        ngayNghiemThu: kq.NgayNghiemThu,
        gioQuyDoi: hoursGuide,
      });
    }

    for (const hd of thamGiaHd) {
      const gvObj = ensureGv(hd.MaGV);
      gvObj.danhSachHoiDong.push({
        maHoiDong: hd.MaHoiDong,
        vaiTro: hd.VaiTro,
        ngayHop: hd.NgayHop,
        namHoc: hd.NamHoc,
        gioQuyDoi: hoursCouncil,
      });
    }

    // Nếu người dùng là GV và chưa có dữ liệu, trả về đối tượng 0
    if (targetMaGV && !gvDataMap.has(targetMaGV)) {
      return {
        maGV: targetMaGV,
        namHoc: namHoc || 'Tất cả',
        hoursGuide,
        hoursCouncil,
        soDeTaiDat: 0,
        soHoiDong: 0,
        gioHuongDan: 0,
        gioHoiDong: 0,
        tongGio: 0,
        danhSachDeTaiDat: [],
        danhSachHoiDong: [],
      };
    }

    const results = Array.from(gvDataMap.values()).map((gv) => {
      const soDeTaiDat = gv.danhSachDeTaiDat.length;
      const soHoiDong = gv.danhSachHoiDong.length;
      const gioHuongDan = soDeTaiDat * hoursGuide;
      const gioHoiDong = soHoiDong * hoursCouncil;
      const tongGio = gioHuongDan + gioHoiDong;

      return {
        maGV: gv.maGV,
        namHoc: namHoc || 'Tất cả',
        hoursGuide,
        hoursCouncil,
        soDeTaiDat,
        soHoiDong,
        gioHuongDan,
        gioHoiDong,
        tongGio,
        danhSachDeTaiDat: gv.danhSachDeTaiDat,
        danhSachHoiDong: gv.danhSachHoiDong,
      };
    });

    if (user.role === 'GV') {
      return results[0];
    }

    return {
      namHoc: namHoc || 'Tất cả',
      hoursGuide,
      hoursCouncil,
      tongSoGiangVien: results.length,
      danhSach: results,
    };
  }

  // =========================================================================
  // 5. XUẤT BÁO CÁO (FR-19)
  // =========================================================================
  async exportReport(
    user: CurrentUserPayload,
    options: {
      loai: 'de-tai' | 'dang-ky' | 'sinh-vien-chua-dang-ky' | 'gio-nckh';
      dinhDang?: 'xlsx' | 'csv' | 'json';
      namHoc?: string;
      maNganh?: string;
    },
    auth?: string,
  ) {
    const maxRows = Number(this.config.get('EXPORT_MAX_ROWS') ?? 5000);

    let rows: any[] = [];
    let title = '';

    switch (options.loai) {
      case 'de-tai': {
        title = 'Báo cáo Thống kê Đề tài Nghiên cứu Khoa học';
        const res = await this.getThongKeDeTai(
          user,
          {
            maNganh: options.maNganh,
            size: maxRows,
          },
          auth,
        );
        rows = res.data;
        break;
      }

      case 'sinh-vien-chua-dang-ky': {
        title = 'Danh sách Sinh viên Chưa Đăng ký Đề tài';
        if (user.role !== 'QTV') {
          throw new ForbiddenException('Chỉ Quản trị viên mới được xuất danh sách sinh viên');
        }
        const res = await this.getThongKeSinhVien(
          user,
          {
            maNganh: options.maNganh,
            size: maxRows,
          },
          auth,
        );
        rows = res.danhSachChuaDangKy;
        break;
      }

      case 'gio-nckh': {
        title = 'Báo cáo Quy đổi Giờ Nghiên cứu Khoa học';
        const res = await this.getGioNckh(user, options.namHoc);
        if (user.role === 'GV') {
          rows = [res];
        } else {
          rows = ('danhSach' in res ? res.danhSach : []) || [];
        }
        break;
      }

      case 'dang-ky': {
        title = 'Báo cáo Danh sách Đăng ký Đề tài';
        const qb = this.dkRepo.createQueryBuilder('dk');
        if (user.role === 'GV') {
          const myTopics = await this.dtRepo.find({
            where: { MaGV: user.maDinhDanh },
            select: { MaDeTai: true },
          });
          const ids = myTopics.map((t) => t.MaDeTai);
          if (ids.length === 0) {
            rows = [];
            break;
          }
          qb.where('dk.MaDeTai IN (:...ids)', { ids });
        }
        rows = await qb.orderBy('dk.NgayDangKy', 'DESC').take(maxRows).getMany();
        break;
      }

      default:
        throw new ForbiddenException('Loại báo cáo không hợp lệ');
    }

    if (rows.length > maxRows) {
      throw new PayloadTooLargeException(
        `Số dòng vượt quá giới hạn tối đa ${maxRows}. Vui lòng thu hẹp bộ lọc.`,
      );
    }

    const format = options.dinhDang || 'json';

    if (format === 'json') {
      return {
        title,
        tongSo: rows.length,
        loai: options.loai,
        thoiGianXuat: new Date().toISOString(),
        nguoiXuat: user.username,
        data: rows,
      };
    }

    // Xuất CSV với UTF-8 BOM
    const csvContent = this.convertToCsv(rows);
    return {
      title,
      format: 'csv',
      content: csvContent,
      filename: `BaoCao_${options.loai}_${Date.now()}.csv`,
    };
  }

  private convertToCsv(data: any[]): string {
    if (!data || data.length === 0) return '\uFEFFKhông có dữ liệu';
    const keys = Object.keys(data[0]);
    const header = keys.join(',');
    const rows = data.map((item) =>
      keys
        .map((k) => {
          let val = item[k];
          if (val === null || val === undefined) val = '';
          if (typeof val === 'object') val = JSON.stringify(val);
          val = String(val).replace(/"/g, '""');
          return `"${val}"`;
        })
        .join(','),
    );
    return '\uFEFF' + [header, ...rows].join('\r\n');
  }
}
