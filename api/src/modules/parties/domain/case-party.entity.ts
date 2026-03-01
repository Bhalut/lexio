import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { CaseFile } from '../../cases/domain/case-file.entity';

@Entity('case_parties')
export class CaseParty {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  caseId!: string;

  @ManyToOne(() => CaseFile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'caseId' })
  case!: CaseFile;

  @Column()
  role!: string;

  @Column()
  name!: string;

  @Column({ type: 'text', nullable: true })
  detail?: string | null;

  @Column({ default: 0 })
  sortOrder!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
