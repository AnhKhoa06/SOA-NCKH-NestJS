import { Controller, Get, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lop } from './lop.entity';

@Controller('lop')
export class LopController {
  constructor(
    @InjectRepository(Lop)
    private readonly lopRepo: Repository<Lop>,
  ) {}

  @Get()
  async findAll(
    @Query('maNganh') maNganh?: string,
    @Query('khoaHoc') khoaHoc?: string,
  ) {
    const qb = this.lopRepo
      .createQueryBuilder('l')
      .where('l.trangThai = :tt', { tt: 'HOAT_DONG' });
    if (maNganh) qb.andWhere('l.maNganh = :maNganh', { maNganh });
    if (khoaHoc) qb.andWhere('l.khoaHoc = :khoaHoc', { khoaHoc });
    return qb.orderBy('l.maLop', 'ASC').getMany();
  }
}
