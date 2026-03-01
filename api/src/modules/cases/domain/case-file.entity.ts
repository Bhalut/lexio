import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { CaseStatus } from './case-status.enum';

@Entity('case_files')
export class CaseFile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  caseNumber!: string;

  @Column()
  clientName!: string;

  @Column({ type: 'enum', enum: CaseStatus, default: CaseStatus.ACTIVE })
  status!: CaseStatus;

  @Column({ nullable: true })
  stage?: string;

  @Column({ nullable: true })
  responsibleUserName?: string;

  @Column({ nullable: true })
  caseType?: string;

  @Column({ nullable: true })
  courtName?: string;

  @Column({ nullable: true })
  opposingPartyName?: string;

  @Column({ nullable: true })
  nextAction?: string;

  @Column({ type: 'timestamp', nullable: true })
  nextHearingDate?: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
