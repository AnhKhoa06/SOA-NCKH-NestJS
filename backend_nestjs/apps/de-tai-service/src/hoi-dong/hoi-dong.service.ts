import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeTai } from '../de-tai.entity';
import { CreateHoiDongDto } from './dto/create-hoi-dong.dto';
import { HoiDong } from './hoi-dong.entity';

@Injectable()
export class HoiDongService {
  constructor(
    @InjectRepository(HoiDong) private readonly repo: Repository<HoiDong>,
    @InjectRepository(DeTai) private readonly deTaiRepo: Repository<DeTai>,
  ) {}

  async create(dto: CreateHoiDongDto): Promise<HoiDong> {
    const deTai = await this.deTaiRepo.findOne({
      where: { maDeTai: dto.maDeTai },
    });
    if (!deTai) throw new NotFoundException('Không tìm thấy đề tài');

    const hasConflict = dto.thanhViens.some(
      (tv) => tv.maGV === deTai.giangVienHuongDan,
    );
    if (hasConflict) {
      throw new BadRequestException(
        'Xung đột lợi ích: Giảng viên hướng dẫn không được làm thành viên hội đồng của đề tài này',
      );
    }

    const hoiDong = this.repo.create(dto);
    return this.repo.save(hoiDong);
  }

  async findAll(): Promise<HoiDong[]> {
    return this.repo.find({ relations: ['thanhViens'] });
  }
}
