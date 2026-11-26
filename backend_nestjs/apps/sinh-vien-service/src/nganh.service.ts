import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Like, Repository } from 'typeorm';
import { Nganh } from './nganh.entity';
import { Khoa } from './khoa.entity';
import { SinhVien } from './sinh-vien.entity';
import { CreateNganhDto } from './dto/create-nganh.dto';
import { UpdateNganhDto } from './dto/update-nganh.dto';
import { QueryNganhDto } from './dto/query-nganh.dto';

@Injectable()
export class NganhService {
  constructor(
    @InjectRepository(Nganh)
    private readonly repo: Repository<Nganh>,
    @InjectRepository(Khoa)
    private readonly khoaRepo: Repository<Khoa>,
    @InjectRepository(SinhVien)
    private readonly svRepo: Repository<SinhVien>,
  ) {}

  async create(dto: CreateNganhDto): Promise<Nganh> {
    const khoa = await this.khoaRepo.findOne({
      where: { maKhoa: dto.maKhoa, trangThai: 'HOAT_DONG' },
    });
    if (!khoa) {
      throw new NotFoundException({
        statusCode: 404,
        code: 'KHONG_TIM_THAY_KHOA',
        message: `Không tìm thấy khoa ${dto.maKhoa} đang hoạt động`,
      });
    }

    const existing = await this.repo.findOne({
      where: { maNganh: dto.maNganh },
    });
    if (existing) {
      if (existing.trangThai === 'HOAT_DONG') {
        throw new ConflictException({
          statusCode: 409,
          code: 'TRUNG_MA',
          message: `Mã ngành ${dto.maNganh} đã tồn tại`,
        });
      }
      Object.assign(existing, dto, { trangThai: 'HOAT_DONG' });
      return this.repo.save(existing);
    }

    return this.repo.save(this.repo.create(dto));
  }

  async findAll(q: QueryNganhDto) {
    const base: FindOptionsWhere<Nganh> = { trangThai: 'HOAT_DONG' };
    if (q.maKhoa) base.maKhoa = q.maKhoa;

    const where: FindOptionsWhere<Nganh> | FindOptionsWhere<Nganh>[] = q.q
      ? [
          { ...base, tenNganh: Like(`%${q.q}%`) },
          { ...base, maNganh: Like(`%${q.q}%`) },
        ]
      : base;

    const [data, total] = await this.repo.findAndCount({
      where,
      order: { maNganh: 'ASC' },
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

  async findOne(maNganh: string): Promise<Nganh> {
    const nganh = await this.repo.findOne({ where: { maNganh } });
    if (!nganh || nganh.trangThai !== 'HOAT_DONG') {
      throw new NotFoundException(`Không tìm thấy ngành ${maNganh}`);
    }
    return nganh;
  }

  async update(maNganh: string, dto: UpdateNganhDto): Promise<Nganh> {
    const nganh = await this.findOne(maNganh);
    if (dto.maKhoa) {
      const khoa = await this.khoaRepo.findOne({
        where: { maKhoa: dto.maKhoa, trangThai: 'HOAT_DONG' },
      });
      if (!khoa) {
        throw new NotFoundException(
          `Không tìm thấy khoa ${dto.maKhoa} đang hoạt động`,
        );
      }
    }
    Object.assign(nganh, dto);
    return this.repo.save(nganh);
  }

  async remove(maNganh: string): Promise<{ message: string }> {
    const nganh = await this.findOne(maNganh);
    const soSV = await this.svRepo.count({
      where: { maNganh, trangThai: 'HOAT_DONG' },
    });
    if (soSV > 0) {
      throw new ConflictException({
        statusCode: 409,
        code: 'NGANH_CON_DU_LIEU',
        message: `Không thể xóa: ngành còn ${soSV} sinh viên đang hoạt động`,
      });
    }
    nganh.trangThai = 'NGUNG_HOAT_DONG';
    await this.repo.save(nganh);
    return { message: `Đã xóa ngành ${maNganh}` };
  }
}
