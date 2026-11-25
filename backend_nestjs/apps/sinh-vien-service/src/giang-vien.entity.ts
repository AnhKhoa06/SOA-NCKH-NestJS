import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('GiangVien')
export class GiangVien {
  @PrimaryColumn({ name: 'MaGV', type: 'varchar', length: 20 })
  maGV: string;

  @Column({ name: 'HoTen', type: 'varchar', length: 255 })
  hoTen: string;

  @Column({ name: 'Email', type: 'varchar', length: 255, nullable: true })
  email: string;

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
