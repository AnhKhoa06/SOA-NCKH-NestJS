import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('Khoa')
export class Khoa {
  @PrimaryColumn({ name: 'MaKhoa', type: 'varchar', length: 20 })
  maKhoa: string;

  @Column({ name: 'TenKhoa', type: 'varchar', length: 255 })
  tenKhoa: string;

  @Column({
    name: 'TrangThai',
    type: 'varchar',
    length: 20,
    default: 'HOAT_DONG',
  })
  trangThai: string;
}
