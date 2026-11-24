import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, In, IsNull, Repository } from 'typeorm';
import type { CurrentUserPayload } from '@app/common';
import { ThongBao } from './thong-bao.entity';

@Injectable()
export class ThongBaoService {
  constructor(
    @InjectRepository(ThongBao)
    private readonly repo: Repository<ThongBao>,
  ) {}

  // Thông báo gửi đúng mã của mình, hoặc gửi cho cả vai trò của mình (MaNguoiNhan trống)
  private dieuKien(
    user: CurrentUserPayload,
    them: FindOptionsWhere<ThongBao> = {},
  ): FindOptionsWhere<ThongBao>[] {
    const dk: FindOptionsWhere<ThongBao>[] = [
      { ...them, maNguoiNhan: IsNull(), vaiTroNhan: user.role },
    ];
    if (user.maDinhDanh) {
      dk.push({ ...them, maNguoiNhan: user.maDinhDanh });
    }
    return dk;
  }

  async danhSach(
    user: CurrentUserPayload,
    page?: number,
    size?: number,
    chuaDoc?: string,
  ) {
    const p = page && page > 0 ? page : 1;
    const s = size && size > 0 ? Math.min(size, 100) : 20;
    const them: FindOptionsWhere<ThongBao> =
      chuaDoc === 'true' ? { daDoc: false } : {};

    const [data, total] = await this.repo.findAndCount({
      where: this.dieuKien(user, them),
      order: { ngayTao: 'DESC' },
      skip: (p - 1) * s,
      take: s,
    });
    return {
      data,
      page: p,
      size: s,
      total,
      totalPages: Math.ceil(total / s),
    };
  }

  async demChuaDoc(user: CurrentUserPayload) {
    const soLuong = await this.repo.count({
      where: this.dieuKien(user, { daDoc: false }),
    });
    return { soLuong };
  }

  async danhDauDaDoc(user: CurrentUserPayload, id: number) {
    const tb = await this.repo.findOne({
      where: this.dieuKien(user, { idThongBao: id }),
    });
    if (!tb) {
      throw new NotFoundException('Không tìm thấy thông báo');
    }
    if (!tb.daDoc) {
      tb.daDoc = true;
      await this.repo.save(tb);
    }
    return { idThongBao: id, daDoc: true };
  }

  async danhDauTatCaDaDoc(user: CurrentUserPayload) {
    const chuaDoc = await this.repo.find({
      where: this.dieuKien(user, { daDoc: false }),
      select: { idThongBao: true },
    });
    if (chuaDoc.length > 0) {
      await this.repo.update(
        { idThongBao: In(chuaDoc.map((x) => x.idThongBao)) },
        { daDoc: true },
      );
    }
    return { soLuong: chuaDoc.length };
  }
}