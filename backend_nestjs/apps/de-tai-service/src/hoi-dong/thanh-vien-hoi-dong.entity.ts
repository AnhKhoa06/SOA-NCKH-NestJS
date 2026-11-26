import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import type { HoiDong } from './hoi-dong.entity';

@Entity('ThanhVienHoiDong')
export class ThanhVienHoiDong {
  @PrimaryGeneratedColumn({ name: 'MaThanhVien' })
  maThanhVien: number;

  @Column({ name: 'MaHoiDong' })
  maHoiDong: number;

  @Column({ name: 'MaGV', type: 'varchar', length: 20 })
  maGV: string;

  @Column({
    name: 'VaiTro',
    type: 'varchar',
    length: 50,
    default: 'UY_VIEN',
  })
  vaiTro: string;

  @ManyToOne('HoiDong', 'thanhViens', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'MaHoiDong' })
  hoiDong: Relation<HoiDong>;
}
