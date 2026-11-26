import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GiangVien } from './giang-vien.entity';
import { Khoa } from './khoa.entity';
import { CreateGiangVienDto } from './dto/create-giang-vien.dto';
import { UpdateGiangVienDto } from './dto/update-giang-vien.dto';
import { QueryGiangVienDto } from './dto/query-giang-vien.dto';

@Injectable()
export class GiangVienService {
  constructor(
    @InjectRepository(GiangVien) private readonly repo: Repository<GiangVien>,
    @InjectRepository(Khoa) private readonly khoaRepo: Repository<Khoa>,
  ) {}

  private async kiemTraKhoa(maKhoa?: string): Promise<void> {
    if (!maKhoa) return;
    const khoa = await this.khoaRepo.findOne({ where: { maKhoa } });
    if (!khoa || khoa.trangThai !== 'HOAT_DONG') {
      throw new NotFoundException(`Không tìm thấy khoa ${maKhoa}`);
    }
  }

  async create(dto: CreateGiangVienDto): Promise<GiangVien> {
    const maGV = dto.maGV.trim().toUpperCase();
    const existing = await this.repo.findOne({ where: { maGV } });
    if (existing && existing.trangThai === 'HOAT_DONG') {
      throw new ConflictException({
        statusCode: 409,
        code: 'TRUNG_MA',
        message: `Mã giảng viên ${maGV} đã tồn tại`,
      });
    }
    if (dto.email?.trim()) {
      const emailTrung = await this.repo.findOne({
        where: { email: dto.email.trim(), trangThai: 'HOAT_DONG' },
      });
      if (emailTrung && emailTrung.maGV !== maGV) {
        throw new ConflictException({
          statusCode: 409,
          code: 'TRUNG_EMAIL',
          message: `Email ${dto.email.trim()} đã được sử dụng`,
        });
      }
    }
    await this.kiemTraKhoa(dto.maKhoa);
    if (existing) {
      Object.assign(existing, dto, {
        maGV,
        email: dto.email?.trim() || undefined,
        trangThai: 'HOAT_DONG',
      });
      return this.repo.save(existing);
    }
    return this.repo.save(
      this.repo.create({
        ...dto,
        maGV,
        email: dto.email?.trim() || undefined,
      }),
    );
  }

  async findAll(q: QueryGiangVienDto) {
    const qb = this.repo
      .createQueryBuilder('gv')
      .where('gv.trangThai = :tt', { tt: 'HOAT_DONG' });
    if (q.q) {
      qb.andWhere('(gv.hoTen LIKE :kw OR gv.maGV LIKE :kw)', {
        kw: `%${q.q}%`,
      });
    }
    if (q.maKhoa) qb.andWhere('gv.maKhoa = :k', { k: q.maKhoa });

    const [data, total] = await qb
      .orderBy('gv.maGV', 'ASC')
      .skip((q.page - 1) * q.size)
      .take(q.size)
      .getManyAndCount();

    return {
      data,
      page: q.page,
      size: q.size,
      total,
      totalPages: Math.ceil(total / q.size),
    };
  }

  async findOne(maGV: string): Promise<GiangVien> {
    const gv = await this.repo.findOne({ where: { maGV } });
    if (!gv) throw new NotFoundException(`Không tìm thấy giảng viên ${maGV}`);
    return gv;
  }

  async update(maGV: string, dto: UpdateGiangVienDto): Promise<GiangVien> {
    const gv = await this.findOne(maGV);
    await this.kiemTraKhoa(dto.maKhoa);
    Object.assign(gv, dto);
    return this.repo.save(gv);
  }

  async remove(maGV: string): Promise<{ message: string }> {
    const gv = await this.findOne(maGV);
    gv.trangThai = 'NGUNG_HOAT_DONG';
    await this.repo.save(gv);
    return { message: `Đã xóa giảng viên ${maGV}` };
  }
}
