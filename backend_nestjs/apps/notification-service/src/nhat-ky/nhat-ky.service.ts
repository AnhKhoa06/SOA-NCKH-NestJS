import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NhatKy } from './nhat-ky.entity';

@Injectable()
export class NhatKyService {
  constructor(
    @InjectRepository(NhatKy)
    private readonly repo: Repository<NhatKy>,
  ) {}

  private parseNgay(v: string | undefined, ten: string): Date | undefined {
    if (!v) return undefined;
    const d = new Date(v);
    if (isNaN(d.getTime())) {
      throw new BadRequestException(`${ten} không hợp lệ (dùng định dạng ISO 8601)`);
    }
    return d;
  }

  async danhSach(params: {
    page?: number;
    size?: number;
    tu?: string;
    den?: string;
    nguoiThucHien?: string;
    hanhDong?: string;
  }) {
    const p = params.page && params.page > 0 ? params.page : 1;
    const s = params.size && params.size > 0 ? Math.min(params.size, 100) : 20;
    const tu = this.parseNgay(params.tu, 'tu');
    const den = this.parseNgay(params.den, 'den');

    const qb = this.repo.createQueryBuilder('nk');
    if (tu) qb.andWhere('nk.thoiDiem >= :tu', { tu });
    if (den) qb.andWhere('nk.thoiDiem <= :den', { den });
    if (params.nguoiThucHien) {
      qb.andWhere('nk.nguoiThucHien = :nguoi', { nguoi: params.nguoiThucHien });
    }
    if (params.hanhDong) {
      qb.andWhere('nk.hanhDong = :hanhDong', { hanhDong: params.hanhDong });
    }

    const [data, total] = await qb
      .orderBy('nk.thoiDiem', 'DESC')
      .addOrderBy('nk.idNhatKy', 'DESC')
      .skip((p - 1) * s)
      .take(s)
      .getManyAndCount();

    return { data, page: p, size: s, total, totalPages: Math.ceil(total / s) };
  }
}