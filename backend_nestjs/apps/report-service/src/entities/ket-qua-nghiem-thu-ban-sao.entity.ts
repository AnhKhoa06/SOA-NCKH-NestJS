import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
} from 'typeorm';

@Entity('KetQuaNghiemThuBanSao')
export class KetQuaNghiemThuBanSao {
  @PrimaryColumn()
  MaDeTai: number;

  @Column({ length: 20 })
  MaGV: string;

  @Column({ length: 20 })
  KetLuan: string; // DAT, KHONG_DAT

  @Column('decimal', { precision: 4, scale: 2 })
  DiemTB: number;

  @Column({ length: 20, nullable: true })
  NamHoc: string;

  @CreateDateColumn()
  NgayNghiemThu: Date;
}
