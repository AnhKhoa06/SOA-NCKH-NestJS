import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Nganh } from './nganh.entity';

@Injectable()
export class NganhService {
  constructor(
    @InjectRepository(Nganh)
    private readonly repo: Repository<Nganh>,
  ) {}

  async findOne(ma: string): Promise<Nganh> {
    const nganh = await this.repo.findOne({ where: { maNganh: ma } });
    if (!nganh) throw new NotFoundException(`Không tìm thấy ngành ${ma}`);
    return nganh;
  }
}
