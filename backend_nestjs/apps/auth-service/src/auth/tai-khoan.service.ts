import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
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

  // Hỏi Academic xem MaSV/MaGV có tồn tại không. Bật bằng VERIFY_MA_DINH_DANH=true
  private async xacMinh(vaiTro: 'GV' | 'SV', ma: string, auth?: string) {
    if (this.config.get('VERIFY_MA_DINH_DANH', 'false') !== 'true') return;
    const base = this.config.get('ACADEMIC_URL', 'http://localhost:3001');
    const path = vaiTro === 'SV' ? `/sinh-vien/${ma}` : `/giang-vien/${ma}`;
    let res: Response;
    try {
      res = await fetch(base + path, {
        headers: { Authorization: auth ?? '' },
        signal: AbortSignal.timeout(3000),
      });
    } catch {
      throw new ServiceUnavailableException('Dịch vụ học vụ không phản hồi');
    }
    if (res.status === 404) {
      throw new NotFoundException(`Không tìm thấy ${vaiTro} có mã ${ma}`);
    }
    if (!res.ok) {
      throw new ServiceUnavailableException('Dịch vụ học vụ không phản hồi');
    }
  }

  async tao(dto: CreateTaiKhoanDto, auth?: string) {
    this.kiemTraMatKhau(dto.matKhau);
    if (
      await this.tkRepo.findOne({ where: { tenDangNhap: dto.tenDangNhap } })
    ) {
      throw new ConflictException('Tên đăng nhập đã tồn tại');
    }
    if (
      await this.tkRepo.findOne({
        where: { vaiTro: dto.vaiTro, maDinhDanh: dto.maDinhDanh },
      })
    ) {
      throw new ConflictException('Mã định danh này đã có tài khoản');
    }
    await this.xacMinh(dto.vaiTro, dto.maDinhDanh, auth);
    const tk = await this.tkRepo.save(
      this.tkRepo.create({
        tenDangNhap: dto.tenDangNhap,
        matKhauBam: await bcrypt.hash(dto.matKhau, 10),
        vaiTro: dto.vaiTro,
        maDinhDanh: dto.maDinhDanh,
      }),
    );
    return this.an(tk);
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

  async datLaiMatKhau(id: number, matKhauMoi: string) {
    this.kiemTraMatKhau(matKhauMoi);
    const tk = await this.tim(id);
    tk.matKhauBam = await bcrypt.hash(matKhauMoi, 10);
    await this.tkRepo.save(tk);
    await this.thuHoiToken(id);
    return { message: 'Đã đặt lại mật khẩu' };
  }

  async doiMatKhau(id: number, matKhauCu: string, matKhauMoi: string) {
    const tk = await this.tim(id);
    if (!(await bcrypt.compare(matKhauCu, tk.matKhauBam))) {
      throw new BadRequestException('Mật khẩu cũ không đúng');
    }
    this.kiemTraMatKhau(matKhauMoi);
    tk.matKhauBam = await bcrypt.hash(matKhauMoi, 10);
    await this.tkRepo.save(tk);
    await this.thuHoiToken(id);
    return { message: 'Đã đổi mật khẩu, hãy đăng nhập lại' };
  }
}
