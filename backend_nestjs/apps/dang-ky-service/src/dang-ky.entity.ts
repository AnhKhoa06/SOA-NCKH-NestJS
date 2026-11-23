import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { TrangThaiDangKy } from './trang-thai-dang-ky';

@Entity('DangKy')
export class DangKy {
  @PrimaryGeneratedColumn({ name: 'MaDangKy' })
  maDangKy: number;

  @Column({ name: 'MaSV' })
  maSV: string;

  @Column({ name: 'MaDeTai' })
  maDeTai: number;

  @Column({
    name: 'NgayDangKy',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  ngayDangKy: Date;

  @Column({
    name: 'TrangThai',
    type: 'varchar',
    length: 20,
    default: TrangThaiDangKy.CHO_DUYET,
  })
  trangThai: TrangThaiDangKy;

  @Column({ name: 'LyDoTuChoi', type: 'varchar', length: 500, nullable: true })
  lyDoTuChoi: string | null;

  // Cột do MySQL tự tính từ TrangThai, chỉ đọc
  @Column({
    name: 'HieuLuc',
    type: 'tinyint',
    nullable: true,
    insert: false,
    update: false,
  })
  hieuLuc: number | null;
}
