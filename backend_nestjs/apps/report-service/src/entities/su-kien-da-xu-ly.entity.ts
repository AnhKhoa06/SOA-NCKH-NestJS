import { CreateDateColumn, Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('SuKienDaXuLy')
export class SuKienDaXuLy {
  @PrimaryColumn({ length: 36 })
  EventId: string;

  @Column({ length: 50 })
  EventType: string;

  @CreateDateColumn()
  NgayXuLy: Date;
}
