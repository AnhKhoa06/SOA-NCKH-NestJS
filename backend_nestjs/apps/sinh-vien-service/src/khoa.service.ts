import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Khoa } from './khoa.entity';
import { Nganh } from './nganh.entity';
import { GiangVien } from './giang-vien.entity';
import { CreateKhoaDto } from './dto/create-khoa.dto';
import { UpdateKhoaDto } from './dto/update-khoa.dto';
import { QueryKhoaDto } from './dto/query-khoa.dto';

@Injectable()
export class KhoaService {
  constructor(
    @InjectRepository(Khoa) private readonly repo: Repository<Khoa>,
    @InjectRepository(Nganh) private readonly nganhRepo: Repository<Nganh>,
    @InjectRepository(GiangVien)
    private readonly gvRepo: Repository<GiangVien>,
  ) {}

  async create(dto: CreateKhoaDto): Promise<Khoa> {
    const existing = await this.repo.findOne({ where: { maKhoa: dto.maKhoa } });
    if (existing) {
      throw new ConflictException({
        statusCode: 409,
        code: 'TRUNG_MA',
        message: `Mã khoa ${dto.maKhoa} đã tồn tại`,
      });
    }
    return this.repo.save(this.repo.create(dto));
  }

  async findAll(q: QueryKhoaDto) {
    const base = { trangThai: 'HOAT_DONG' };
    const where = q.q
      ? [
          { ...base, tenKhoa: Like(`%${q.q}%`) },
          { ...base, maKhoa: Like(`%${q.q}%`) },
        ]
      : base;
    const [data, total] = await this.repo.findAndCount({
      where,
      order: { maKhoa: 'ASC' },
      skip: (q.page - 1) * q.size,
      take: q.size,
    });
    return {
      data,
      page: q.page,
      size: q.size,
      total,
      totalPages: Math.ceil(total / q.size),
    };
  }

  async findOne(maKhoa: string): Promise<Khoa> {
    const khoa = await this.repo.findOne({ where: { maKhoa } });
    if (!khoa || khoa.trangThai !== 'HOAT_DONG') {
      throw new NotFoundException(`Không tìm thấy khoa ${maKhoa}`);
    }
    return khoa;
  }

  async update(maKhoa: string, dto: UpdateKhoaDto): Promise<Khoa> {
    const khoa = await this.findOne(maKhoa);
    Object.assign(khoa, dto);
    return this.repo.save(khoa);
  }

  async remove(maKhoa: string): Promise<{ message: string }> {
    const khoa = await this.findOne(maKhoa);
    const soNganh = await this.nganhRepo.count({
      where: { maKhoa, trangThai: 'HOAT_DONG' },
    });
    const soGV = await this.gvRepo.count({
      where: { maKhoa, trangThai: 'HOAT_DONG' },
    });
    if (soNganh > 0 || soGV > 0) {
      throw new ConflictException({
        statusCode: 409,
        code: 'KHOA_CON_DU_LIEU',
        message: `Không thể xóa: khoa còn ${soNganh} ngành và ${soGV} giảng viên đang hoạt động`,
      });
    }
    khoa.trangThai = 'NGUNG_HOAT_DONG';
    await this.repo.save(khoa);
    return { message: `Đã xóa khoa ${maKhoa}` };
  }
}
