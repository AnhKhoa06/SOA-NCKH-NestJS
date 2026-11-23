import {
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import { DangKy } from './dang-ky.entity';
import { CreateDangKyDto } from './dto/create-dang-ky.dto';
import { UpdateDangKyDto } from './dto/update-dang-ky.dto';
import { ConfigService } from '@nestjs/config';
import { TRANG_THAI_CON_HIEU_LUC } from './trang-thai-dang-ky';

@Injectable()
export class DangKyService {
  private readonly sinhVienUrl: string;
  private readonly deTaiUrl: string;

  constructor(
    @InjectRepository(DangKy)
    private readonly repo: Repository<DangKy>,
    private readonly http: HttpService,
    config: ConfigService,
  ) {
    this.sinhVienUrl = config.get<string>(
      'SINHVIEN_URL',
      'http://localhost:3000/sinh-vien',
    );
    this.deTaiUrl = config.get<string>(
      'DETAI_URL',
      'http://localhost:3000/de-tai',
    );
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

  private async checkDeTai(maDeTai: number, auth?: string, ignoreId?: number) {
    const deTai = await this.callService(
      `${this.deTaiUrl}/${maDeTai}`,
      `Không tìm thấy đề tài ${maDeTai}`,
      auth,
    );
    const toiDa = deTai.soLuongToiDa ?? deTai.SoLuongToiDa ?? 1;
    const daDangKy = await this.repo.count({
      where: { maDeTai, trangThai: In(TRANG_THAI_CON_HIEU_LUC) },
    });
    const tru = ignoreId ? 1 : 0;
    if (daDangKy - tru >= toiDa) {
      throw new ConflictException('Đề tài đã đủ số lượng sinh viên');
    }
  }

  async create(dto: CreateDangKyDto, auth?: string): Promise<DangKy> {
    await this.callService(
      `${this.sinhVienUrl}/${dto.maSV}`,
      `Không tìm thấy sinh viên ${dto.maSV}`,
      auth,
    );
    const daCo = await this.repo.findOne({
      where: { maSV: dto.maSV, trangThai: In(TRANG_THAI_CON_HIEU_LUC) },
    });
    if (daCo) {
      throw new ConflictException({
        statusCode: 409,
        code: 'DA_CO_DANG_KY',
        message: 'Sinh viên đã đăng ký một đề tài',
      });
    }
    await this.checkDeTai(dto.maDeTai, auth);
    return await this.luu(this.repo.create(dto));
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
      await this.checkDeTai(dto.maDeTai, auth, id);
    }
    Object.assign(dk, dto);
    return await this.luu(dk);
  }

  async remove(id: number): Promise<{ message: string }> {
    const dk = await this.findOne(id);
    await this.repo.remove(dk);
    return { message: `Đã hủy đăng ký ${id} thành công` };
  }
}
