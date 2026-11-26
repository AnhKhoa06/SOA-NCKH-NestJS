import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('SinhVien')
export class SinhVien {
  @PrimaryColumn({ name: 'MaSV', type: 'varchar', length: 20 })
  maSV: string;

  @Column({ name: 'HoTen', type: 'varchar', length: 255 })
  hoTen: string;

  @Column({ name: 'Email', type: 'varchar', length: 255, nullable: true })
  email: string;

  @Column({ name: 'KhoaHoc', type: 'varchar', length: 20, nullable: true })
  khoaHoc: string;

  @Column({ name: 'Lop', type: 'varchar', length: 50, nullable: true })
  lop: string;

  @Column({ name: 'MaNganh', type: 'varchar', length: 20, nullable: true })
  maNganh: string;

  @Column({
    name: 'GPA',
    type: 'decimal',
    precision: 3,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value?: number) => value,
      from: (value?: string | null) =>
        value === null || value === undefined ? null : parseFloat(value),
    },
  })
  gpa: number | null;

  @Column({
    name: 'TrangThai',
    type: 'varchar',
    length: 20,
    default: 'HOAT_DONG',
  })
  trangThai: string;

  toJSON() {
    return { ...this, MaSV: this.maSV };
  }
}
