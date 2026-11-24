import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('ThamGiaHoiDongBanSao')
export class ThamGiaHoiDongBanSao {
  @PrimaryColumn()
  MaHoiDong: number;

  @PrimaryColumn({ length: 20 })
  MaGV: string;

  @Column({ length: 50 })
  VaiTro: string; // CHU_TICH, THU_KY, PHAN_BIEN, UY_VIEN

  @Column({ type: 'datetime' })
  NgayHop: Date;

  @Column({ length: 20, nullable: true })
  NamHoc: string;
}
