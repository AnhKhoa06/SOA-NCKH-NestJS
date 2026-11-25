import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('Nganh')
export class Nganh {
  @PrimaryColumn({ name: 'MaNganh' })
  maNganh: string;

  @Column({ name: 'TenNganh' })
  tenNganh: string;

  @Column({ name: 'MaKhoa' })
  maKhoa: string;

  @Column({ name: 'TrangThai', default: 'HOAT_DONG' })
  trangThai: string;
}
