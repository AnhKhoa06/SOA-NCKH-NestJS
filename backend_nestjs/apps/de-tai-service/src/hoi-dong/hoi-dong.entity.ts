import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import type { ThanhVienHoiDong } from './thanh-vien-hoi-dong.entity';

@Entity('HoiDong')
export class HoiDong {
  @PrimaryGeneratedColumn({ name: 'MaHoiDong' })
  maHoiDong: number;

  @Column({ name: 'TenHoiDong', type: 'varchar', length: 255 })
  tenHoiDong: string;

  @Column({ name: 'MaDeTai' })
  maDeTai: number;

  @Column({ name: 'NgayThanhLap', type: 'date', nullable: true })
  ngayThanhLap: Date;

  @OneToMany('ThanhVienHoiDong', 'hoiDong', { cascade: true })
  thanhViens: Relation<ThanhVienHoiDong[]>;
}
