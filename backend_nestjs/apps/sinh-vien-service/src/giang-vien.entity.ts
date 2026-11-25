import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('GiangVien')
export class GiangVien {
  @PrimaryColumn({ name: 'MaGV' })
  maGV: string;

  @Column({ name: 'HoTen' })
  hoTen: string;

  @Column({ name: 'Email', nullable: true })
  email: string;

  @Column({ name: 'MaKhoa' })
  maKhoa: string;

  @Column({ name: 'TrangThai', default: 'HOAT_DONG' })
  trangThai: string;
}
