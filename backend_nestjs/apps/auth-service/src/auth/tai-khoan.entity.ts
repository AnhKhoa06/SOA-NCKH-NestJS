import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('TaiKhoan')
export class TaiKhoan {
  @PrimaryGeneratedColumn({ name: 'IdTaiKhoan' })
  id: number;

  @Column({ name: 'TenDangNhap', unique: true })
  tenDangNhap: string;

  @Column({ name: 'MatKhauBam' })
  matKhauBam: string;

  @Column({ name: 'VaiTro', type: 'enum', enum: ['QTV', 'GV', 'SV'] })
  vaiTro: 'QTV' | 'GV' | 'SV';

  @Column({ name: 'MaDinhDanh', type: 'varchar', length: 20, nullable: true })
  maDinhDanh: string | null;

  @Column({ name: 'Email', type: 'varchar', length: 255, nullable: true, unique: true })
  email: string | null;

  @Column({
    name: 'TrangThai',
    type: 'enum',
    enum: ['HOAT_DONG', 'KHOA_TAM', 'NGUNG_HOAT_DONG'],
    default: 'HOAT_DONG',
  })
  trangThai: string;

  @Column({ name: 'BatBuocDoiMatKhau', type: 'boolean', default: false })
  batBuocDoiMatKhau: boolean;

  @Column({ name: 'SoLanSai', default: 0 })
  soLanSai: number;

  @Column({ name: 'KhoaDen', type: 'datetime', nullable: true })
  khoaDen: Date | null;

  @Column({
    name: 'NgayTao',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  ngayTao: Date;
}
