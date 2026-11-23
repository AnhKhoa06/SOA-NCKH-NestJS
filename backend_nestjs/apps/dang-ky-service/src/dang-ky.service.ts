import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, FindOptionsWhere, In, Repository } from 'typeorm';
import type { CurrentUserPayload } from '@app/common';
import { firstValueFrom } from 'rxjs';
import { DangKy } from './dang-ky.entity';
import { CreateDangKyDto } from './dto/create-dang-ky.dto';
import { UpdateDangKyDto } from './dto/update-dang-ky.dto';
import { QueryDangKyDto } from './dto/query-dang-ky.dto';
import { ConfigService } from '@nestjs/config';
import { TRANG_THAI_CON_HIEU_LUC, TrangThaiDangKy } from './trang-thai-dang-ky';
import { ChiTieuDeTai } from './chi-tieu-de-tai.entity';

@Injectable()
export class DangKyService {
  private readonly sinhVienUrl: string;
  private readonly deTaiUrl: string;
  private readonly choPhepThieuMaGV: boolean;

  constructor(
    @InjectRepository(DangKy)
    private readonly repo: Repository<DangKy>,
    private readonly http: HttpService,
    private readonly dataSource: DataSource,
    config: ConfigService,
  ) {
    this.sinhVienUrl = config.get<string>(
      'SINHVIEN_URL',
      'http://localhost:3001/sinh-vien',
    );
    this.deTaiUrl = config.get<string>(
      'DETAI_URL',
      'http://localhost:3002/de-tai',
    );
    // Chỉ để chạy thử khi Topic chưa trả maGV. Mặc định tắt: thiếu maGV thì không cho duyệt.
    this.choPhepThieuMaGV =
      config.get<string>('ALLOW_MISSING_MAGV', 'false') === 'true';
  }

  // Gọi dịch vụ khác qua HTTP/REST
  private async callService(
    url: string,
    notFoundMsg: string,
    auth?: string,
  ): Promise<any> {
    try {
      const res = await firstValueFrom(
        this.http.get(url, { headers: auth ? { Authorization: auth } : {} }),
      );
      return res.data;
    } catch (e: any) {
      if (e?.response?.status === 404) throw new NotFoundException(notFoundMsg);
      throw new ServiceUnavailableException(`Không gọi được dịch vụ: ${url}`);
    }
  }

  // Ghi vào CSDL; ràng buộc UNIQUE (MaSV, HieuLuc) là chốt chặn cuối cho BR-05
  // kể cả khi hai yêu cầu đến cùng lúc
  private async luu(dk: DangKy): Promise<DangKy> {
    try {
      return await this.repo.save(dk);
    } catch (e: any) {
      const code = e?.code ?? e?.driverError?.code;
      if (code === 'ER_DUP_ENTRY') {
        throw new ConflictException({
          statusCode: 409,
          code: 'DA_CO_DANG_KY',
          message: 'Sinh viên đã đăng ký một đề tài',
        });
      }
      throw e;
    }
  }

  // Lỗi nghiệp vụ 422 (không đạt điều kiện), có mã lỗi theo SRS bảng 35
  private khongDat(code: string, message: string) {
    return new UnprocessableEntityException({
      statusCode: 422,
      code,
      message,
    });
  }

  /**
   * FR-11: kiểm tra điều kiện đăng ký (BR-01 đến BR-05, BR-18).
   * Dữ liệu lấy bằng HTTP từ Academic và Topic, chuyển tiếp Authorization.
   * Hợp đồng JSON: sinh viên { maNganh, gpa, trangThai }; đề tài { trangThai,
   * maNganh, gpaYeuCau, chiTieu, ngayMoDangKy, ngayDongDangKy } (phancong.md, Khang A0).
   * Khi dịch vụ kia CHƯA trả một trường thì bỏ qua đúng điều kiện cần trường đó,
   * để chạy được trong lúc Academic và Topic chưa làm xong.
   * boQuaId: id đăng ký đang sửa (không tính vào các đếm).
   */
  private async kiemTraDieuKien(
    maSV: string,
    maDeTai: number,
    auth?: string,
    boQuaId?: number,
  ) {
    const sv = await this.callService(
      `${this.sinhVienUrl}/${maSV}`,
      `Không tìm thấy sinh viên ${maSV}`,
      auth,
    );
    const dt = await this.callService(
      `${this.deTaiUrl}/${maDeTai}`,
      `Không tìm thấy đề tài ${maDeTai}`,
      auth,
    );

    // BR-01: đề tài phải đang mở
    if (dt.trangThai !== undefined && dt.trangThai !== 'DANG_MO') {
      throw this.khongDat('DETAI_KHONG_MO', 'Đề tài hiện không mở đăng ký');
    }

    // BR-02: cùng ngành
    const nganhSV = sv.maNganh ?? sv.MaNganh;
    const nganhDT = dt.maNganh ?? dt.MaNganh;
    if (nganhSV && nganhDT && nganhSV !== nganhDT) {
      throw this.khongDat('SAI_NGANH', 'Đề tài không thuộc ngành của bạn');
    }

    // BR-03: GPA đủ yêu cầu
    const gpa = sv.gpa ?? sv.GPA;
    const gpaYeuCau = dt.gpaYeuCau ?? dt.GpaYeuCau;
    if (gpa != null && gpaYeuCau != null && Number(gpa) < Number(gpaYeuCau)) {
      throw this.khongDat(
        'GPA_KHONG_DAT',
        `GPA ${gpa} chưa đạt mức yêu cầu ${gpaYeuCau}`,
      );
    }

    // BR-18: còn trong hạn đăng ký của đợt
    const bayGio = Date.now();
    const mo = dt.ngayMoDangKy ? Date.parse(dt.ngayMoDangKy) : NaN;
    const dong = dt.ngayDongDangKy ? Date.parse(dt.ngayDongDangKy) : NaN;
    if (
      (!Number.isNaN(mo) && bayGio < mo) ||
      (!Number.isNaN(dong) && bayGio > dong)
    ) {
      throw this.khongDat('NGOAI_HAN', 'Ngoài thời hạn đăng ký của đợt');
    }

    // BR-05: mỗi sinh viên một đăng ký còn hiệu lực (chốt chặn cuối là UNIQUE trong CSDL)
    const daCo = await this.repo.find({
      where: { maSV, trangThai: In(TRANG_THAI_CON_HIEU_LUC) },
    });
    if (daCo.some((d) => d.maDangKy !== boQuaId)) {
      throw new ConflictException({
        statusCode: 409,
        code: 'DA_CO_DANG_KY',
        message: 'Sinh viên đã đăng ký một đề tài',
      });
    }

    // BR-04: chưa đủ chỉ tiêu. Chỉ đăng ký ĐÃ DUYỆT chiếm chỗ; đăng ký chờ duyệt
    // thì giảng viên quyết định. Việc khóa dòng chỉ tiêu khi duyệt làm ở B5.
    const chiTieu =
      dt.chiTieu ?? dt.ChiTieu ?? dt.soLuongToiDa ?? dt.SoLuongToiDa;
    if (chiTieu != null) {
      const daDuyet = await this.repo.count({
        where: { maDeTai, trangThai: TrangThaiDangKy.DA_DUYET },
      });
      if (daDuyet >= Number(chiTieu)) {
        throw new ConflictException({
          statusCode: 409,
          code: 'HET_CHI_TIEU',
          message: 'Đề tài đã đủ số lượng sinh viên',
        });
      }
    }
  }

  async create(maSV: string, maDeTai: number, auth?: string): Promise<DangKy> {
    await this.kiemTraDieuKien(maSV, maDeTai, auth);
    // B7 sẽ phát EV-06 (DangKyDuocTao) tại đây khi có libs/events
    return await this.luu(this.repo.create({ maSV, maDeTai }));
  }

  async findAll(): Promise<DangKy[]> {
    return await this.repo.find();
  }

  async findOne(id: number): Promise<DangKy> {
    const dk = await this.repo.findOne({ where: { maDangKy: id } });
    if (!dk) throw new NotFoundException(`Không tìm thấy đăng ký ${id}`);
    return dk;
  }

  async update(
    id: number,
    dto: UpdateDangKyDto,
    auth?: string,
  ): Promise<DangKy> {
    const dk = await this.findOne(id);
    if (dto.maDeTai && dto.maDeTai !== dk.maDeTai) {
      await this.kiemTraDieuKien(dk.maSV, dto.maDeTai, auth, id);
    }
    Object.assign(dk, dto);
    return await this.luu(dk);
  }

  /**
   * FR-12 / B4: sinh viên hủy đăng ký của chính mình.
   * - Chỉ chủ đăng ký mới hủy được (403).
   * - Chỉ hủy khi còn CHO_DUYET (BR-06), sai thì 409 TRANG_THAI_KHONG_HOP_LE.
   * Dùng UPDATE có điều kiện để an toàn khi giảng viên duyệt cùng lúc:
   * chỉ một bên thắng, không cần khóa.
   */
  async huy(id: number, maSV: string): Promise<DangKy> {
    const dk = await this.findOne(id);
    if (dk.maSV !== maSV) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'KHONG_DU_QUYEN',
        message: 'Bạn chỉ được hủy đăng ký của chính mình',
      });
    }
    const kq = await this.repo.update(
      { maDangKy: id, trangThai: TrangThaiDangKy.CHO_DUYET },
      { trangThai: TrangThaiDangKy.DA_HUY },
    );
    if (!kq.affected) {
      throw new ConflictException({
        statusCode: 409,
        code: 'TRANG_THAI_KHONG_HOP_LE',
        message: 'Chỉ được hủy đăng ký đang chờ duyệt',
      });
    }
    // B7 sẽ phát EV-09 (DangKyDaHuy) tại đây khi có libs/events
    return await this.findOne(id);
  }

  // BR-08: chỉ giảng viên phụ trách đề tài mới được duyệt hoặc từ chối.
  // Hỏi lại Topic mỗi lần, không tin dữ liệu nào lưu ở đây.
  private async layDeTaiDeXuLy(dk: DangKy, maGV: string, auth?: string) {
    const dt = await this.callService(
      `${this.deTaiUrl}/${dk.maDeTai}`,
      `Không tìm thấy đề tài ${dk.maDeTai}`,
      auth,
    );
    const maGVDeTai = dt.maGV ?? dt.MaGV;
    if (maGVDeTai == null) {
      if (!this.choPhepThieuMaGV) {
        throw this.khongDat(
          'DETAI_THIEU_GIANG_VIEN',
          'Đề tài chưa có thông tin giảng viên phụ trách',
        );
      }
    } else if (maGVDeTai !== maGV) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'KHONG_DU_QUYEN',
        message: 'Bạn không phải giảng viên phụ trách đề tài này',
      });
    }
    return dt;
  }

  /**
   * FR-13 / B5: duyệt đăng ký.
   * Trong MỘT giao dịch: khóa dòng chỉ tiêu của đề tài (FOR UPDATE), đếm lại số
   * đã duyệt, rồi mới duyệt. Hai giảng viên duyệt cùng lúc vào đề tài còn một
   * chỗ thì người sau phải chờ khóa, đếm lại thấy đủ và nhận 409 HET_CHI_TIEU (BR-04).
   * UPDATE có điều kiện CHO_DUYET chặn trường hợp SV vừa hủy hoặc đã bị xử lý.
   */
  async duyet(id: number, maGV: string, auth?: string): Promise<DangKy> {
    const dk = await this.findOne(id);
    const dt = await this.layDeTaiDeXuLy(dk, maGV, auth);

    if (dt.trangThai !== undefined && dt.trangThai !== 'DANG_MO') {
      throw this.khongDat('DETAI_KHONG_MO', 'Đề tài hiện không mở');
    }
    const chiTieu =
      dt.chiTieu ?? dt.ChiTieu ?? dt.soLuongToiDa ?? dt.SoLuongToiDa;

    // Tạo dòng khóa NGOÀI giao dịch: câu lệnh tự commit nên nhả khóa ngay,
    // tránh hai giao dịch cùng giữ khóa chia sẻ rồi cùng xin khóa ghi (deadlock)
    await this.dataSource.query(
      'INSERT IGNORE INTO ChiTieuDeTai (MaDeTai, SoDaDuyet) VALUES (?, 0)',
      [dk.maDeTai],
    );

    for (let lan = 1; ; lan++) {
      try {
        await this.dataSource.transaction(async (m) => {
          // Khóa dòng chỉ tiêu; người đến sau chờ ở đây
          await m.findOne(ChiTieuDeTai, {
            where: { maDeTai: dk.maDeTai },
            lock: { mode: 'pessimistic_write' },
          });

          // Đếm SAU khi giữ khóa: đây là nguồn sự thật, không dùng SoDaDuyet cũ
          const daDuyet = await m.count(DangKy, {
            where: {
              maDeTai: dk.maDeTai,
              trangThai: TrangThaiDangKy.DA_DUYET,
            },
          });
          if (chiTieu != null && daDuyet >= Number(chiTieu)) {
            throw new ConflictException({
              statusCode: 409,
              code: 'HET_CHI_TIEU',
              message: 'Đề tài đã đủ số lượng sinh viên',
            });
          }

          const kq = await m.update(
            DangKy,
            { maDangKy: id, trangThai: TrangThaiDangKy.CHO_DUYET },
            { trangThai: TrangThaiDangKy.DA_DUYET },
          );
          if (!kq.affected) {
            throw new ConflictException({
              statusCode: 409,
              code: 'TRANG_THAI_KHONG_HOP_LE',
              message: 'Chỉ duyệt được đăng ký đang chờ duyệt',
            });
          }
          await m.update(
            ChiTieuDeTai,
            { maDeTai: dk.maDeTai },
            { soDaDuyet: daDuyet + 1 },
          );
        });
        break;
      } catch (e: any) {
        const code = e?.code ?? e?.driverError?.code;
        // Deadlock là lỗi tạm thời của CSDL: thử lại, quá 3 lần thì báo bận
        if (code === 'ER_LOCK_DEADLOCK' && lan < 3) continue;
        if (code === 'ER_LOCK_DEADLOCK') {
          throw new ServiceUnavailableException({
            statusCode: 503,
            code: 'HE_THONG_BAN',
            message: 'Hệ thống đang bận, hãy thử lại',
          });
        }
        throw e;
      }
    }
    // B7 sẽ phát EV-07 (DangKyDuocDuyet) tại đây khi có libs/events
    return await this.findOne(id);
  }

  // FR-13 / B5: từ chối đăng ký, bắt buộc có lý do (BR-10)
  async tuChoi(
    id: number,
    maGV: string,
    lyDo: string | undefined,
    auth?: string,
  ): Promise<DangKy> {
    const ly = (lyDo ?? '').trim();
    if (!ly) {
      throw new BadRequestException({
        statusCode: 400,
        code: 'THIEU_LY_DO',
        message: 'Phải nhập lý do từ chối',
      });
    }
    const dk = await this.findOne(id);
    await this.layDeTaiDeXuLy(dk, maGV, auth);

    const kq = await this.repo.update(
      { maDangKy: id, trangThai: TrangThaiDangKy.CHO_DUYET },
      { trangThai: TrangThaiDangKy.BI_TU_CHOI, lyDoTuChoi: ly },
    );
    if (!kq.affected) {
      throw new ConflictException({
        statusCode: 409,
        code: 'TRANG_THAI_KHONG_HOP_LE',
        message: 'Chỉ từ chối được đăng ký đang chờ duyệt',
      });
    }
    // B7 sẽ phát EV-08 (DangKyBiTuChoi) tại đây khi có libs/events
    return await this.findOne(id);
  }

  // ===== B6 (FR-14): xem danh sách theo vai trò =====

  private maDinhDanhBatBuoc(user: CurrentUserPayload): string {
    if (!user?.maDinhDanh) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'KHONG_DU_QUYEN',
        message: 'Tài khoản không gắn với mã định danh',
      });
    }
    return user.maDinhDanh;
  }

  // Các đề tài do giảng viên phụ trách, hỏi Topic. Chỉ nhận dòng có maGV khớp,
  // nên nếu Topic chưa lọc theo maGV hoặc chưa trả maGV thì kết quả rỗng (an toàn),
  // không bao giờ lộ đăng ký của đề tài người khác.
  private async deTaiCuaGV(maGV: string, auth?: string): Promise<number[]> {
    const body = await this.callService(
      `${this.deTaiUrl}?maGV=${encodeURIComponent(maGV)}&size=100`,
      'Không tìm thấy đề tài',
      auth,
    );
    const ds: any[] = Array.isArray(body) ? body : (body?.data ?? []);
    return ds
      .filter((d) => (d.maGV ?? d.MaGV) === maGV)
      .map((d) => Number(d.maDeTai ?? d.MaDeTai))
      .filter((n) => Number.isInteger(n));
  }

  // Tên sinh viên lấy MỘT lần theo lô. Lỗi thì trả rỗng, giao diện hiển thị theo mã.
  private async layTenSinhVien(
    maSVs: string[],
    auth?: string,
  ): Promise<Map<string, string>> {
    const kq = new Map<string, string>();
    if (!maSVs.length) return kq;
    try {
      const body = await this.callService(
        `${this.sinhVienUrl}?maSV=${encodeURIComponent(maSVs.join(','))}`,
        'Không tìm thấy sinh viên',
        auth,
      );
      const ds: any[] = Array.isArray(body) ? body : (body?.data ?? []);
      const can = new Set(maSVs);
      for (const sv of ds) {
        const ma = sv.maSV ?? sv.MaSV;
        if (can.has(ma)) kq.set(ma, sv.hoTen ?? sv.HoTen ?? null);
      }
    } catch {
      /* giảm chức năng: để tên rỗng */
    }
    return kq;
  }

  // Tên đề tài: gọi song song theo từng mã khác nhau, dịch vụ lỗi thì để rỗng
  private async layTenDeTai(
    maDeTais: number[],
    auth?: string,
  ): Promise<Map<number, string>> {
    const kq = new Map<number, string>();
    const kqs = await Promise.allSettled(
      maDeTais.map((id) =>
        this.callService(
          `${this.deTaiUrl}/${id}`,
          'Không tìm thấy đề tài',
          auth,
        ),
      ),
    );
    kqs.forEach((r, i) => {
      if (r.status === 'fulfilled') {
        kq.set(maDeTais[i], r.value.tenDeTai ?? r.value.TenDeTai ?? null);
      }
    });
    return kq;
  }

  async timKiem(user: CurrentUserPayload, q: QueryDangKyDto, auth?: string) {
    const page = Math.max(1, parseInt(q.page ?? '1', 10) || 1);
    const size = Math.min(100, Math.max(1, parseInt(q.size ?? '20', 10) || 20));
    const where: FindOptionsWhere<DangKy> = {};

    if (q.trangThai) {
      if (
        !Object.values(TrangThaiDangKy).includes(q.trangThai as TrangThaiDangKy)
      ) {
        throw new BadRequestException('Trạng thái lọc không hợp lệ');
      }
      where.trangThai = q.trangThai as TrangThaiDangKy;
    }
    let maDeTaiLoc: number | undefined;
    if (q.maDeTai) {
      maDeTaiLoc = Number(q.maDeTai);
      if (!Number.isInteger(maDeTaiLoc)) {
        throw new BadRequestException('Mã đề tài lọc không hợp lệ');
      }
    }

    if (user.role === 'SV') {
      where.maSV = this.maDinhDanhBatBuoc(user);
      if (maDeTaiLoc !== undefined) where.maDeTai = maDeTaiLoc;
    } else {
      if (q.maSV) where.maSV = q.maSV;
      if (user.role === 'GV') {
        let ids = await this.deTaiCuaGV(this.maDinhDanhBatBuoc(user), auth);
        if (maDeTaiLoc !== undefined) {
          ids = ids.filter((x) => x === maDeTaiLoc);
        }
        if (!ids.length)
          return { data: [], page, size, total: 0, totalPages: 0 };
        where.maDeTai = In(ids);
      } else if (maDeTaiLoc !== undefined) {
        where.maDeTai = maDeTaiLoc;
      }
    }

    const [rows, total] = await this.repo.findAndCount({
      where,
      order: { maDangKy: 'DESC' },
      skip: (page - 1) * size,
      take: size,
    });

    // Sinh viên chỉ xem đăng ký của mình nên không cần tra tên sinh viên
    const tenSV =
      user.role === 'SV'
        ? new Map<string, string>()
        : await this.layTenSinhVien(
            [...new Set(rows.map((r) => r.maSV))],
            auth,
          );
    const tenDT = await this.layTenDeTai(
      [...new Set(rows.map((r) => r.maDeTai))],
      auth,
    );

    return {
      data: rows.map((r) => ({
        ...r,
        tenSV: tenSV.get(r.maSV) ?? null,
        tenDeTai: tenDT.get(r.maDeTai) ?? null,
      })),
      page,
      size,
      total,
      totalPages: Math.ceil(total / size),
    };
  }

  // Xem một đăng ký: SV chỉ của mình, GV chỉ của đề tài mình, QTV tất cả
  async xemMot(id: number, user: CurrentUserPayload, auth?: string) {
    const dk = await this.findOne(id);
    if (user.role === 'SV') {
      if (dk.maSV !== this.maDinhDanhBatBuoc(user)) {
        throw new ForbiddenException({
          statusCode: 403,
          code: 'KHONG_DU_QUYEN',
          message: 'Bạn chỉ được xem đăng ký của chính mình',
        });
      }
    } else if (user.role === 'GV') {
      const ids = await this.deTaiCuaGV(this.maDinhDanhBatBuoc(user), auth);
      if (!ids.includes(dk.maDeTai)) {
        throw new ForbiddenException({
          statusCode: 403,
          code: 'KHONG_DU_QUYEN',
          message: 'Đăng ký này không thuộc đề tài của bạn',
        });
      }
    }
    return dk;
  }

  async remove(id: number): Promise<{ message: string }> {
    const dk = await this.findOne(id);
    await this.repo.remove(dk);
    return { message: `Đã hủy đăng ký ${id} thành công` };
  }
}
