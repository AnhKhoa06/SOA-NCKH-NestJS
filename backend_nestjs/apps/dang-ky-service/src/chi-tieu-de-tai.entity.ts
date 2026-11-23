import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('ChiTieuDeTai')
export class ChiTieuDeTai {
  @PrimaryColumn({ name: 'MaDeTai' })
  maDeTai: number;

  @Column({ name: 'SoDaDuyet', default: 0 })
  soDaDuyet: number;
}
