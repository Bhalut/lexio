import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CaseFile } from '../../cases/domain/case-file.entity';
import { AppUser } from '../../users/domain/app-user.entity';

@Entity('case_notes')
export class CaseNote {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  caseId!: string;

  @ManyToOne(() => CaseFile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'caseId' })
  case!: CaseFile;

  @Column({ type: 'text' })
  content!: string;

  @Column()
  authorName!: string;

  @Column({ nullable: true })
  authorUserId?: string;

  @ManyToOne(() => AppUser, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'authorUserId' })
  author?: AppUser | null;

  @Column({ nullable: true })
  authorAvatar?: string;

  @Column({ default: false })
  isPinned!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
