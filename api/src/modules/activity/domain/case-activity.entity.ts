import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CaseFile } from '../../cases/domain/case-file.entity';

export enum ActivityType {
  UPLOAD = 'UPLOAD',
  NOTE = 'NOTE',
  STATUS_CHANGE = 'STATUS_CHANGE',
  PARTY_ADDED = 'PARTY_ADDED',
  PARTY_UPDATED = 'PARTY_UPDATED',
  PARTY_REMOVED = 'PARTY_REMOVED',
  SYSTEM = 'SYSTEM',
}

@Entity('case_activities')
export class CaseActivity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  caseId!: string;

  @ManyToOne(() => CaseFile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'caseId' })
  case!: CaseFile;

  @Column({ type: 'enum', enum: ActivityType })
  type!: ActivityType;

  @Column({ type: 'text' })
  description!: string;

  @Column({ nullable: true })
  metadata?: string; // JSON string

  @Column()
  authorName!: string;

  @Column({ nullable: true })
  authorAvatar?: string;

  @CreateDateColumn()
  createdAt!: Date;
}
