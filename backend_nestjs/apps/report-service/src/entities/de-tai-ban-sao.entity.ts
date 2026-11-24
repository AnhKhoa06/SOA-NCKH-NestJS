import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('DeTaiBanSao')
export class DeTaiBanSao {
  @PrimaryColumn()
  MaDeTai: number;

  @Column({ length: 255 })
  TenDeTai: string;

  @Column({ length: 20, nullable: true })
  MaGV: string;

  @Column({ length: 20, nullable: true })
  MaNganh: string;

  @Column({ default: 1 })
  ChiTieu: number;

  @Column({ default: 0 })
  SoDaDuyet: number;

  @Column({ length: 50, default: 'CHO_DUYET' })
  TrangThai: string;

  @UpdateDateColumn()
  NgayCapNhat: Date;
}
