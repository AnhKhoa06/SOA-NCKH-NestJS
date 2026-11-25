import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import * as ExcelJS from 'exceljs';
import type { CurrentUserPayload } from '@app/common';
import { SinhVien } from './sinh-vien.entity';
import { Nganh } from './nganh.entity';
import { CreateSinhVienDto } from './dto/create-sinh-vien.dto';
import { UpdateSinhVienDto } from './dto/update-sinh-vien.dto';
import { QuerySinhVienDto } from './dto/query-sinh-vien.dto';

@Injectable()
export class SinhVienService {
  constructor(
    @InjectRepository(SinhVien)
    private readonly sinhVienRepository: Repository<SinhVien>,
    @InjectRepository(Nganh)
    private readonly nganhRepository: Repository<Nganh>,
  ) {}

  private async kiemTraNganh(maNganh?: string): Promise<void> {
    if (!maNganh) return;
    const nganh = await this.nganhRepository.findOne({ where: { maNganh } });
    if (!nganh || nganh.trangThai !== 'HOAT_DONG') {
      throw new NotFoundException(`Không tìm thấy ngành ${maNganh}`);
    }
  }

  // CREATE - Thêm sinh viên mới
  async create(data: CreateSinhVienDto): Promise<SinhVien> {
    const existingStudent = await this.sinhVienRepository.findOne({
      where: { MaSV: data.MaSV },
    });
    if (existingStudent) {
      throw new ConflictException('Mã sinh viên đã tồn tại');
    }
    await this.kiemTraNganh(data.maNganh);
    const sinhVien = this.sinhVienRepository.create(data);
    return await this.sinhVienRepository.save(sinhVien);
  }

  async importFromExcel(file: Express.Multer.File) {
    const workbook = new ExcelJS.Workbook();
    try {
      await workbook.xlsx.load(file.buffer);
    } catch {
      throw new BadRequestException('File không đúng định dạng Excel (.xlsx)');
    }

    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      throw new BadRequestException('File Excel trống');
    }

    const results = { success: 0, failed: 0, errors: [] as string[] };

    for (let i = 2; i <= worksheet.rowCount; i++) {
      const row = worksheet.getRow(i);
      const values = Array.from({ length: 6 }, (_, index) =>
        row.getCell(index + 1).text.trim(),
      );
      if (values.every((value) => !value)) continue;

      const [maSV, hoTen, email, lop, maNganh, gpaText] = values;
      if (!maSV || !hoTen) {
        results.failed++;
        results.errors.push(`Dòng ${i}: Thiếu Mã SV hoặc Họ tên`);
        continue;
      }

      const data = plainToInstance(CreateSinhVienDto, {
        MaSV: maSV,
        hoTen,
        email: email || undefined,
        lop: lop || undefined,
        maNganh: maNganh || undefined,
        gpa: gpaText ? Number(gpaText) : undefined,
      });
      const validationErrors = await validate(data);
      if (validationErrors.length > 0) {
        const messages = validationErrors.flatMap((error) =>
          Object.values(error.constraints ?? {}),
        );
        results.failed++;
        results.errors.push(`Dòng ${i}: ${messages.join('; ')}`);
        continue;
      }

      const existing = await this.sinhVienRepository.findOne({
        where: { MaSV: maSV },
      });
      if (existing) {
        results.failed++;
        results.errors.push(`Dòng ${i}: Mã SV ${maSV} đã tồn tại`);
        continue;
      }

      try {
        await this.kiemTraNganh(data.maNganh);
      } catch (error) {
        if (!(error instanceof NotFoundException)) throw error;
        results.failed++;
        results.errors.push(`Dòng ${i}: ${error.message}`);
        continue;
      }

      try {
        await this.sinhVienRepository.save(
          this.sinhVienRepository.create(data),
        );
        results.success++;
      } catch (error) {
        if (
          error instanceof QueryFailedError &&
          error.driverError.code === 'ER_DUP_ENTRY'
        ) {
          results.failed++;
          results.errors.push(`Dòng ${i}: Mã SV ${maSV} đã tồn tại`);
          continue;
        }
        throw error;
      }
    }

    return {
      message: `Import hoàn tất: ${results.success} thành công, ${results.failed} thất bại`,
      errors: results.errors,
    };
  }

  async findAll(q: QuerySinhVienDto, user: CurrentUserPayload) {
    const rawIds = (q.maSV ?? '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    if (rawIds.length > 100) {
      throw new BadRequestException('Chỉ được tra cứu tối đa 100 mã sinh viên');
    }

    const ids = rawIds;
    if (
      user.role === 'SV' &&
      (ids.length === 0 || ids.some((id) => id !== user.maDinhDanh))
    ) {
      throw new ForbiddenException({
        statusCode: 403,
        code: 'KHONG_DU_QUYEN',
        message: 'Chỉ được xem hồ sơ của chính mình',
      });
    }

    const query = this.sinhVienRepository.createQueryBuilder('sv');
    if (ids.length > 0) {
      query.where('sv.MaSV IN (:...ids)', { ids });
    } else {
      query.where('sv.trangThai = :tt', { tt: 'HOAT_DONG' });
    }

    if (q.q) {
      query.andWhere('(sv.hoTen LIKE :kw OR sv.MaSV LIKE :kw)', {
        kw: `%${q.q}%`,
      });
    }
    if (q.maNganh) {
      query.andWhere('sv.maNganh = :maNganh', { maNganh: q.maNganh });
    }
    if (q.lop) {
      query.andWhere('sv.lop = :lop', { lop: q.lop });
    }

    const [data, total] = await query
      .orderBy('sv.MaSV', 'ASC')
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

  // READ ONE - Lấy 1 sinh viên theo MaSV
  async findOne(MaSV: string): Promise<SinhVien> {
    const sinhVien = await this.sinhVienRepository.findOne({
      where: { MaSV },
    });

    if (!sinhVien || sinhVien.trangThai !== 'HOAT_DONG') {
      throw new NotFoundException(`Không tìm thấy sinh viên ${MaSV}`);
    }

    return sinhVien;
  }

  // UPDATE - Cập nhật thông tin sinh viên
  async update(MaSV: string, data: UpdateSinhVienDto): Promise<SinhVien> {
    const sinhVien = await this.findOne(MaSV);
    await this.kiemTraNganh(data.maNganh);
    Object.assign(sinhVien, data);
    return await this.sinhVienRepository.save(sinhVien);
  }

  async remove(MaSV: string): Promise<{ message: string }> {
    const sinhVien = await this.findOne(MaSV);
    sinhVien.trangThai = 'NGUNG_HOAT_DONG';
    await this.sinhVienRepository.save(sinhVien);
    return { message: `Đã xóa sinh viên ${MaSV}` };
  }
}
