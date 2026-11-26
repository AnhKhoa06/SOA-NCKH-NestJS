import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { CurrentUserPayload } from '@app/common';
import { DeTai } from './de-tai.entity';
import { CreateDeTaiDto } from './dto/create-de-tai.dto';
import { UpdateDeTaiDto } from './dto/update-de-tai.dto';

@Injectable()
export class DeTaiService {
  private readonly academicUrl: string;

  constructor(
    @InjectRepository(DeTai)
    private readonly deTaiRepository: Repository<DeTai>,
    config: ConfigService,
  ) {
    this.academicUrl = config.get<string>('ACADEMIC_URL', 'http://localhost:3001');
  }

  private chuanHoaMa(ma?: string | null): string {
    return (ma ?? '').trim().toUpperCase();
  }

  // Xác minh giảng viên tồn tại ở Academic (có timeout 3s, không treo)
  private async xacMinhGiangVien(
    maGV: string,
    auth?: string,
  ): Promise<{ maGV: string; hoTen: string }> {
    const code = this.chuanHoaMa(maGV);
    if (!code) {
      throw new BadRequestException({
        code: 'THIEU_MA_GV',
        message: 'Phải chọn mã giảng viên hướng dẫn hợp lệ',
      });
    }

    let res: Response;
    try {
      res = await fetch(`${this.academicUrl}/giang-vien/${encodeURIComponent(code)}`, {
        headers: auth ? { Authorization: auth } : {},
        signal: AbortSignal.timeout(3000),
      });
    } catch {
      throw new ServiceUnavailableException({
        code: 'ACADEMIC_KHONG_PHAN_HOI',
        message: 'Không thể kết nối dịch vụ học vụ để xác minh giảng viên',
      });
    }

    if (res.status === 404) {
      throw new BadRequestException({
        code: 'KHONG_TIM_THAY_GV',
        message: `Không tìm thấy giảng viên có mã ${code}`,
      });
    }
    if (!res.ok) {
      throw new ServiceUnavailableException({
        code: 'ACADEMIC_LOI',
        message: 'Dịch vụ học vụ trả về lỗi khi xác minh giảng viên',
      });
    }

    const gv = (await res.json()) as { maGV?: string; MaGV?: string; hoTen?: string; HoTen?: string };
    return {
      maGV: this.chuanHoaMa(gv.maGV ?? gv.MaGV ?? code),
      hoTen: (gv.hoTen ?? gv.HoTen ?? code).trim(),
    };
  }

  private kiemTraQuyenSoHuu(deTai: DeTai, user: CurrentUserPayload) {
    if (user.role === 'QTV') return;
    const myGV = this.chuanHoaMa(user.maDinhDanh);
    if (!myGV || this.chuanHoaMa(deTai.maGV) !== myGV) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'KHONG_DU_QUYEN',
        message: 'Bạn chỉ được thao tác trên đề tài do mình hướng dẫn',
      });
    }
  }

  // Tạo đề tài mới: GV tự gán theo token; QTV phải chọn MaGV hợp lệ
  async createDeTai(
    dto: CreateDeTaiDto,
    user: CurrentUserPayload,
    auth?: string,
  ): Promise<DeTai> {
    const targetMaGV =
      user.role === 'GV'
        ? this.chuanHoaMa(user.maDinhDanh)
        : this.chuanHoaMa(dto.maGV);

    if (user.role === 'GV' && !targetMaGV) {
      throw new ForbiddenException({
        code: 'KHONG_DU_QUYEN',
        message: 'Tài khoản giảng viên chưa gắn mã giảng viên',
      });
    }

    const gv = await this.xacMinhGiangVien(targetMaGV, auth);
    const newDeTai = this.deTaiRepository.create({
      tenDeTai: dto.tenDeTai.trim(),
      moTa: dto.moTa,
      soLuongToiDa: dto.soLuongToiDa ?? 1,
      maGV: gv.maGV,
      giangVienHuongDan: gv.hoTen,
    });
    return await this.deTaiRepository.save(newDeTai);
  }

  // Lấy danh sách đề tài, hỗ trợ lọc theo maGV
  async getAllDeTai(maGV?: string): Promise<DeTai[]> {
    const code = this.chuanHoaMa(maGV);
    if (code) {
      return await this.deTaiRepository.find({ where: { maGV: code } });
    }
    return await this.deTaiRepository.find();
  }

  // Lấy 1 đề tài theo mã
  async findOne(id: number): Promise<DeTai> {
    const deTai = await this.deTaiRepository.findOneBy({ maDeTai: id });
    if (!deTai) {
      throw new NotFoundException(`Không tìm thấy đề tài với ID: ${id}`);
    }
    return deTai;
  }

  // Cập nhật đề tài: GV chỉ sửa được đề tài của mình và không được đổi MaGV sang người khác
  async update(
    id: number,
    data: UpdateDeTaiDto,
    user: CurrentUserPayload,
    auth?: string,
  ): Promise<DeTai> {
    const deTai = await this.findOne(id);
    this.kiemTraQuyenSoHuu(deTai, user);

    let nextMaGV = deTai.maGV;
    let nextTenGV = deTai.giangVienHuongDan;

    if (user.role === 'QTV' && data.maGV !== undefined) {
      const gv = await this.xacMinhGiangVien(data.maGV, auth);
      nextMaGV = gv.maGV;
      nextTenGV = gv.hoTen;
    } else if (user.role === 'GV') {
      nextMaGV = this.chuanHoaMa(user.maDinhDanh);
    }

    const { maGV: _ignoredMaGV, giangVienHuongDan: _ignoredTenGV, ...rest } = data;
    Object.assign(deTai, rest, {
      maGV: nextMaGV,
      giangVienHuongDan: nextTenGV,
    });
    return await this.deTaiRepository.save(deTai);
  }

  // Xóa đề tài: GV chỉ xóa được đề tài của mình
  async remove(id: number, user: CurrentUserPayload): Promise<{ message: string }> {
    const deTai = await this.findOne(id);
    this.kiemTraQuyenSoHuu(deTai, user);

    try {
      await this.deTaiRepository.remove(deTai);
    } catch (e: any) {
      const errno = e?.errno ?? e?.driverError?.errno;
      const code = e?.code ?? e?.driverError?.code;
      if (errno === 1451 || code === 'ER_ROW_IS_REFERENCED_2') {
        throw new ConflictException(
          'Không thể xóa: đề tài đã có sinh viên đăng ký',
        );
      }
      throw e;
    }
    return { message: `Đã xóa thành công đề tài có ID: ${id}` };
  }
}
