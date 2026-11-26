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
import 'multer';
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
    const maSV = (data.maSV?.trim() || data.MaSV?.trim() || '').toUpperCase();
    if (!maSV) {
      throw new BadRequestException('Mã sinh viên không được để trống');
    }

    const existingStudent = await this.sinhVienRepository.findOne({
      where: { maSV },
    });
    if (existingStudent && existingStudent.trangThai === 'HOAT_DONG') {
      throw new ConflictException({
        statusCode: 409,
        code: 'TRUNG_MA',
        message: `Mã sinh viên ${maSV} đã tồn tại`,
      });
    }
    if (data.email?.trim()) {
      const emailTrung = await this.sinhVienRepository.findOne({
        where: { email: data.email.trim(), trangThai: 'HOAT_DONG' },
      });
      if (emailTrung && emailTrung.maSV !== maSV) {
        throw new ConflictException({
          statusCode: 409,
          code: 'TRUNG_EMAIL',
          message: `Email ${data.email.trim()} đã được sử dụng`,
        });
      }
    }
    await this.kiemTraNganh(data.maNganh);
    const studentData = { ...data };
    delete studentData.maSV;
    delete studentData.MaSV;
    if (existingStudent) {
      Object.assign(existingStudent, studentData, {
        email: data.email?.trim() || undefined,
        maSV,
        trangThai: 'HOAT_DONG',
      });
      return await this.sinhVienRepository.save(existingStudent);
    }
    const sinhVien = this.sinhVienRepository.create({
      ...studentData,
      email: data.email?.trim() || undefined,
      maSV,
    });
    return await this.sinhVienRepository.save(sinhVien);
  }

  async importFromExcel(file: Express.Multer.File) {
    const workbook = new ExcelJS.Workbook();
    try {
      await workbook.xlsx.load(file.buffer as any);
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
        maSV,
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
        where: { maSV },
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
      query.where('sv.maSV IN (:...ids)', { ids });
    } else {
      query.where('sv.trangThai = :tt', { tt: 'HOAT_DONG' });
    }

    if (q.q) {
      query.andWhere('(sv.hoTen LIKE :kw OR sv.maSV LIKE :kw)', {
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
      .orderBy('sv.maSV', 'ASC')
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
  async findOne(maSV: string): Promise<SinhVien> {
    const sinhVien = await this.sinhVienRepository.findOne({
      where: { maSV },
    });

    if (!sinhVien || sinhVien.trangThai !== 'HOAT_DONG') {
      throw new NotFoundException(`Không tìm thấy sinh viên ${maSV}`);
    }

    return sinhVien;
  }

  // UPDATE - Cập nhật thông tin sinh viên
  async update(maSV: string, data: UpdateSinhVienDto): Promise<SinhVien> {
    const sinhVien = await this.findOne(maSV);
    await this.kiemTraNganh(data.maNganh);
    const updateData = { ...data };
    delete updateData.maSV;
    delete updateData.MaSV;
    Object.assign(sinhVien, updateData);
    return await this.sinhVienRepository.save(sinhVien);
  }

  async remove(maSV: string): Promise<{ message: string }> {
    const sinhVien = await this.findOne(maSV);
    sinhVien.trangThai = 'NGUNG_HOAT_DONG';
    await this.sinhVienRepository.save(sinhVien);
    return { message: `Đã xóa sinh viên ${maSV}` };
  }
}
