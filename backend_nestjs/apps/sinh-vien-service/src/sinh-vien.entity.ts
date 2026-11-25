import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('SinhVien')
export class SinhVien {
  @PrimaryColumn({ name: 'MaSV' })
  MaSV: string;

  @Column({ name: 'HoTen' })
  hoTen: string;

  @Column({ name: 'Email', nullable: true })
  email: string;

  @Column({ name: 'Lop', nullable: true })
  lop: string;

  @Column({ name: 'MaNganh', nullable: true })
  maNganh: string | null;

  @Column({
    name: 'GPA',
    type: 'decimal',
    precision: 3,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value: number | null) => value,
      from: (value: string | null) =>
        value === null || value === undefined ? null : parseFloat(value),
    },
  })
  gpa: number | null;

  @Column({ name: 'TrangThai', default: 'HOAT_DONG' })
  trangThai: string;
}
