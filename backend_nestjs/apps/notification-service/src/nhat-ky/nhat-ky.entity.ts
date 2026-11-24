import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

// Nhật ký chỉ thêm, không sửa, không xóa (BR-16)
@Entity({ name: 'NhatKy' })
export class NhatKy {
  @PrimaryGeneratedColumn({ name: 'IdNhatKy', type: 'bigint' })
  idNhatKy!: string;

  @Column({ name: 'ThoiDiem', type: 'datetime' })
  thoiDiem!: Date;

  @Column({ name: 'NguoiThucHien', type: 'varchar', length: 50, nullable: true })
  nguoiThucHien!: string | null;

  @Column({ name: 'VaiTro', type: 'varchar', length: 10, nullable: true })
  vaiTro!: string | null;

  @Column({ name: 'HanhDong', type: 'varchar', length: 100 })
  hanhDong!: string;

  @Column({ name: 'DoiTuong', type: 'varchar', length: 100, nullable: true })
  doiTuong!: string | null;

  @Column({ name: 'KetQua', type: 'varchar', length: 20, nullable: true })
  ketQua!: string | null;

  @Column({ name: 'DiaChiIp', type: 'varchar', length: 45, nullable: true })
  diaChiIp!: string | null;

  @Column({ name: 'MaSuKien', type: 'varchar', length: 36, unique: true })
  maSuKien!: string;
}