import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('Lop')
export class Lop {
  @PrimaryColumn({ name: 'MaLop', type: 'varchar', length: 50 })
  maLop: string;

  @Column({ name: 'TenLop', type: 'varchar', length: 100 })
  tenLop: string;

  @Column({ name: 'KhoaHoc', type: 'varchar', length: 20 })
  khoaHoc: string;

  @Column({ name: 'MaNganh', type: 'varchar', length: 20 })
  maNganh: string;

  @Column({
    name: 'TrangThai',
    type: 'varchar',
    length: 20,
    default: 'HOAT_DONG',
  })
  trangThai: string;
}
