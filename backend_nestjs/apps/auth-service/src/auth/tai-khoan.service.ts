import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { FindOptionsWhere, Like, Repository } from 'typeorm';
import { RefreshToken } from './refresh-token.entity';
import { TaiKhoan } from './tai-khoan.entity';
import { CreateTaiKhoanDto } from './dto/tai-khoan.dto';

@Injectable()
export class TaiKhoanService {
  constructor(
    private config: ConfigService,
    @InjectRepository(TaiKhoan) private tkRepo: Repository<TaiKhoan>,
    @InjectRepository(RefreshToken) private rtRepo: Repository<RefreshToken>,
  ) {}

  private kiemTraMatKhau(p: string) {
    const min = Number(this.config.get('PASSWORD_MIN_LENGTH', 8));
    if (p.length < min) {
      throw new BadRequestException(`Mật khẩu tối thiểu ${min} ký tự`);
    }
  }

  private sinhMatKhauNgauNhien(doDai = 10): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#';
    const bytes = randomBytes(doDai);
    let out = '';
    for (let i = 0; i < doDai; i++) {
      out += chars[bytes[i] % chars.length];
    }
    return out;
  }

  private thuHoiToken(idTaiKhoan: number) {
    return this.rtRepo.update(
      { idTaiKhoan, daThuHoi: false },
      { daThuHoi: true },
    );
  }

  private async tim(id: number) {
    const tk = await this.tkRepo.findOne({ where: { id } });
    if (!tk) throw new NotFoundException('Không tìm thấy tài khoản');
    return tk;
  }

  private an(tk: TaiKhoan) {
    const { matKhauBam, ...rest } = tk;
    return rest;
  }

  private async goiAcademic(
    path: string,
    init: RequestInit & { auth?: string },
  ): Promise<Response> {
    const base = this.config.get('ACADEMIC_URL', 'http://localhost:3001');
    try {
      return await fetch(base + path, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...(init.auth ? { Authorization: init.auth } : {}),
          ...(init.headers || {}),
        },
        signal: AbortSignal.timeout(3000),
      });
    } catch {
      throw new ServiceUnavailableException('Dịch vụ học vụ không phản hồi');
    }
  }

  // Hỏi Academic xem MaSV/MaGV có tồn tại không khi không tạo kèm hồ sơ
  private async xacMinh(vaiTro: 'GV' | 'SV', ma: string, auth?: string) {
    if (this.config.get('VERIFY_MA_DINH_DANH', 'false') !== 'true') return;
    const path = vaiTro === 'SV' ? `/sinh-vien/${ma}` : `/giang-vien/${ma}`;
    const res = await this.goiAcademic(path, { method: 'GET', auth });
    if (res.status === 404) {
      throw new NotFoundException(`Không tìm thấy ${vaiTro} có mã ${ma}`);
    }
    if (!res.ok) {
      throw new ServiceUnavailableException('Dịch vụ học vụ không phản hồi');
    }
  }

  // Tạo hồ sơ Academic trước khi lưu TaiKhoan; nếu bước 2 lỗi sẽ bù trừ bằng DELETE
  private async taoHoSoAcademic(
    dto: CreateTaiKhoanDto,
    ma: string,
    email: string | null,
    auth?: string,
  ): Promise<string> {
    const path = dto.vaiTro === 'SV' ? '/sinh-vien' : '/giang-vien';
    const body =
      dto.vaiTro === 'SV'
        ? {
            maSV: ma,
            hoTen: dto.hoTen!.trim(),
            email: email ?? undefined,
            khoaHoc: dto.khoaHoc?.trim() || undefined,
            lop: dto.lop?.trim() || undefined,
            maNganh: dto.maNganh?.trim() || undefined,
          }
        : {
            maGV: ma,
            hoTen: dto.hoTen!.trim(),
            email: email ?? undefined,
            maKhoa: dto.maKhoa?.trim() || 'CNTT',
          };

    const res = await this.goiAcademic(path, {
      method: 'POST',
      body: JSON.stringify(body),
      auth,
    });

    if (!res.ok) {
      let errData: any = null;
      try {
        errData = await res.json();
      } catch {
        errData = null;
      }
      throw new HttpException(
        errData || { message: 'Không thể tạo hồ sơ học vụ' },
        res.status,
      );
    }

    return `${path}/${encodeURIComponent(ma)}`;
  }

  async tao(dto: CreateTaiKhoanDto, auth?: string) {
    const ma = dto.maDinhDanh.trim().toUpperCase();
    const tenDangNhap = (dto.tenDangNhap?.trim() || ma).toUpperCase();
    const email = dto.email?.trim() || null;
    const rawPass = dto.matKhau?.trim() || this.sinhMatKhauNgauNhien();
    this.kiemTraMatKhau(rawPass);

    if (
      await this.tkRepo
        .createQueryBuilder('tk')
        .where('LOWER(tk.tenDangNhap) = LOWER(:u)', { u: tenDangNhap })
        .orWhere('LOWER(tk.maDinhDanh) = LOWER(:m)', { m: ma })
        .getOne()
    ) {
      throw new ConflictException({
        statusCode: 409,
        code: 'TRUNG_MA',
        message: `Mã định danh hoặc tên đăng nhập ${ma} đã tồn tại`,
      });
    }

    if (
      email &&
      (await this.tkRepo
        .createQueryBuilder('tk')
        .where('LOWER(tk.email) = LOWER(:email)', { email })
        .getOne())
    ) {
      throw new ConflictException({
        statusCode: 409,
        code: 'TRUNG_EMAIL',
        message: `Email ${email} đã được sử dụng`,
      });
    }

    let rollbackPath: string | null = null;
    if (dto.hoTen?.trim()) {
      rollbackPath = await this.taoHoSoAcademic(dto, ma, email, auth);
    } else {
      await this.xacMinh(dto.vaiTro, ma, auth);
    }

    try {
      const tk = await this.tkRepo.save(
        this.tkRepo.create({
          tenDangNhap,
          matKhauBam: await bcrypt.hash(rawPass, 10),
          vaiTro: dto.vaiTro,
          maDinhDanh: ma,
          email,
          batBuocDoiMatKhau: dto.batBuocDoiMatKhau ?? true,
        }),
      );
      return {
        ...this.an(tk),
        ...(dto.matKhau?.trim() ? {} : { matKhauTam: rawPass }),
      };
    } catch (err) {
      if (rollbackPath) {
        await this.goiAcademic(rollbackPath, { method: 'DELETE', auth }).catch(
          () => null,
        );
      }
      throw err;
    }
  }

  async danhSach(page = 1, size = 20, vaiTro?: string, q?: string) {
    page = Math.max(1, Number(page) || 1);
    size = Math.min(100, Math.max(1, Number(size) || 20));
    const where: FindOptionsWhere<TaiKhoan> = {};
    if (vaiTro === 'QTV' || vaiTro === 'GV' || vaiTro === 'SV')
      where.vaiTro = vaiTro;
    if (q) where.tenDangNhap = Like(`%${q}%`);
    const [rows, total] = await this.tkRepo.findAndCount({
      where,
      order: { id: 'ASC' },
      skip: (page - 1) * size,
      take: size,
    });
    return {
      data: rows.map((r) => this.an(r)),
      page,
      size,
      total,
      totalPages: Math.ceil(total / size),
    };
  }

  // Thông tin tài khoản của chính người đang đăng nhập
  async toi(id: number) {
    return this.an(await this.tim(id));
  }

  async capNhatEmail(id: number, email?: string) {
    const tk = await this.tim(id);
    const nextEmail = email?.trim() || null;
    if (nextEmail && nextEmail.toLowerCase() !== (tk.email ?? '').toLowerCase()) {
      const trung = await this.tkRepo
        .createQueryBuilder('tk')
        .where('LOWER(tk.email) = LOWER(:email)', { email: nextEmail })
        .getOne();
      if (trung) {
        throw new ConflictException({
          statusCode: 409,
          code: 'TRUNG_EMAIL',
          message: `Email ${nextEmail} đã được sử dụng`,
        });
      }
    }
    tk.email = nextEmail;
    await this.tkRepo.save(tk);
    return this.an(tk);
  }

  async khoa(id: number, nguoiThaoTac: number) {
    if (id === nguoiThaoTac) {
      throw new BadRequestException('Không thể tự khóa tài khoản của mình');
    }
    const tk = await this.tim(id);
    tk.trangThai = 'KHOA_TAM';
    await this.tkRepo.save(tk);
    await this.thuHoiToken(id);
    return this.an(tk);
  }

  async moKhoa(id: number) {
    const tk = await this.tim(id);
    tk.trangThai = 'HOAT_DONG';
    tk.soLanSai = 0;
    tk.khoaDen = null;
    await this.tkRepo.save(tk);
    return this.an(tk);
  }

  async datLaiMatKhau(id: number, matKhauMoi?: string) {
    const rawPass = matKhauMoi?.trim() || this.sinhMatKhauNgauNhien();
    this.kiemTraMatKhau(rawPass);
    const tk = await this.tim(id);
    tk.matKhauBam = await bcrypt.hash(rawPass, 10);
    tk.batBuocDoiMatKhau = true;
    await this.tkRepo.save(tk);
    await this.thuHoiToken(id);
    return {
      message: 'Đã đặt lại mật khẩu',
      ...(matKhauMoi?.trim() ? {} : { matKhauTam: rawPass }),
    };
  }

  async doiMatKhau(id: number, matKhauCu: string, matKhauMoi: string) {
    const tk = await this.tim(id);
    if (!(await bcrypt.compare(matKhauCu, tk.matKhauBam))) {
      throw new BadRequestException('Mật khẩu cũ không đúng');
    }
    this.kiemTraMatKhau(matKhauMoi);
    tk.matKhauBam = await bcrypt.hash(matKhauMoi, 10);
    tk.batBuocDoiMatKhau = false;
    await this.tkRepo.save(tk);
    await this.thuHoiToken(id);
    return { message: 'Đã đổi mật khẩu, hãy đăng nhập lại' };
  }
}
