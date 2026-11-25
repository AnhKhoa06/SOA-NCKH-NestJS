import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GiangVien } from './giang-vien.entity';

@Injectable()
export class GiangVienService {
  constructor(
    @InjectRepository(GiangVien)
    private readonly repo: Repository<GiangVien>,
  ) {}

  async findOne(maGV: string): Promise<GiangVien> {
    const gv = await this.repo.findOne({ where: { maGV } });
    if (!gv) throw new NotFoundException(`Không tìm thấy giảng viên ${maGV}`);
    return gv;
  }
}
