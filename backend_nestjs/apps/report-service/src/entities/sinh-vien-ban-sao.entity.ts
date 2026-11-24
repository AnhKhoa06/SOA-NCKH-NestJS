import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('SinhVienBanSao')
export class SinhVienBanSao {
  @PrimaryColumn({ length: 20 })
  MaSV: string;

  @Column({ length: 255, nullable: true })
  HoTen: string;

  @Column({ length: 50, nullable: true })
  Lop: string;

  @Column({ length: 20, nullable: true })
  MaNganh: string;

  @Column('decimal', { precision: 3, scale: 2, nullable: true })
  GPA: number;

  @Column({ length: 50, default: 'HOAT_DONG' })
  TrangThai: string;

  @UpdateDateColumn()
  NgayCapNhat: Date;
}
