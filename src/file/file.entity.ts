import { Column,Entity, PrimaryColumn } from 'typeorm';

@Entity('file')
export class FileEntity {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  uploaded_at?: Date;

  @Column()
  size: number;
}
