import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('file')
export class FileEntity {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column({ default: false })
  uploaded: boolean;

  @Column({ nullable: true })
  size?: number;
}
