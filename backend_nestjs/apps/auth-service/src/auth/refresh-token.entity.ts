import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('RefreshToken')
export class RefreshToken {
  @PrimaryGeneratedColumn({ name: 'IdRefreshToken' })
  id: number;

  @Column({ name: 'IdTaiKhoan' })
  idTaiKhoan: number;

  @Column({ name: 'TokenBam' })
  tokenBam: string;

  @Column({ name: 'HetHan', type: 'datetime' })
  hetHan: Date;

  @Column({ name: 'DaThuHoi', default: false })
  daThuHoi: boolean;

  @Column({
    name: 'NgayTao',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  ngayTao: Date;
}
