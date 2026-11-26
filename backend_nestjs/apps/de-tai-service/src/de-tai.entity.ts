import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('DeTai')
export class DeTai {
  @PrimaryGeneratedColumn({ name: 'MaDeTai' })
  maDeTai: number;

  @Column({ name: 'TenDeTai' })
  tenDeTai: string;

  @Column({ name: 'MoTa', nullable: true })
  moTa: string;

  @Column({ name: 'GiangVienHuongDan', nullable: true })
  giangVienHuongDan: string;

  @Column({ name: 'MaGV', type: 'varchar', length: 20, nullable: true })
  maGV: string | null;

  @Column({ name: 'SoLuongToiDa', default: 1 })
  soLuongToiDa: number;
}
