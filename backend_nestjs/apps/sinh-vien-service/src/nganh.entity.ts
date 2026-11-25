import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('Nganh')
export class Nganh {
  @PrimaryColumn({ name: 'MaNganh', type: 'varchar', length: 20 })
  maNganh: string;

  @Column({ name: 'TenNganh', type: 'varchar', length: 255 })
  tenNganh: string;

  @Column({ name: 'MaKhoa', type: 'varchar', length: 20 })
  maKhoa: string;

  @Column({
    name: 'TrangThai',
    type: 'varchar',
    length: 20,
    default: 'HOAT_DONG',
  })
  trangThai: string;
}
