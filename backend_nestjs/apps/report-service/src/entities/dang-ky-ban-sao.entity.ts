import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('DangKyBanSao')
export class DangKyBanSao {
  @PrimaryColumn()
  MaDangKy: number;

  @Column({ length: 20 })
  MaSV: string;

  @Column()
  MaDeTai: number;

  @Column({ length: 50, default: 'CHO_DUYET' })
  TrangThai: string;

  @CreateDateColumn()
  NgayDangKy: Date;

  @UpdateDateColumn()
  NgayCapNhat: Date;
}
