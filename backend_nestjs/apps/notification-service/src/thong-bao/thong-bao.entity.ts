import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'ThongBao' })
export class ThongBao {
  @PrimaryGeneratedColumn({ name: 'IdThongBao' })
  idThongBao!: number;

  // Mã người nhận (MaSV/MaGV). NULL khi gửi cho cả một vai trò (ví dụ QTV).
  @Column({ name: 'MaNguoiNhan', type: 'varchar', length: 20, nullable: true })
  maNguoiNhan!: string | null;

  @Column({ name: 'VaiTroNhan', type: 'varchar', length: 10, nullable: true })
  vaiTroNhan!: string | null;

  @Column({ name: 'Loai', type: 'varchar', length: 50 })
  loai!: string;

  @Column({ name: 'TieuDe', type: 'varchar', length: 255 })
  tieuDe!: string;

  @Column({ name: 'NoiDung', type: 'text', nullable: true })
  noiDung!: string | null;

  @Column({ name: 'DaDoc', type: 'boolean', default: false })
  daDoc!: boolean;

  @Column({ name: 'MaSuKien', type: 'varchar', length: 36 })
  maSuKien!: string;

  @CreateDateColumn({ name: 'NgayTao', type: 'datetime' })
  ngayTao!: Date;
}