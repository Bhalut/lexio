import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

export enum CaseAccessLevel {
  VIEWER = 'VIEWER',
  REVIEWER = 'REVIEWER',
  EDITOR = 'EDITOR',
  OWNER = 'OWNER',
}

@Entity('case_assignments')
@Unique('UQ_case_assignments_caseId_userId', ['caseId', 'userId'])
export class CaseAssignment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('IDX_case_assignments_caseId')
  @Column('uuid')
  caseId!: string;

  @Index('IDX_case_assignments_userId')
  @Column('uuid')
  userId!: string;

  @Column({ type: 'varchar', default: CaseAccessLevel.VIEWER })
  accessLevel!: CaseAccessLevel;

  @Column('uuid', { nullable: true })
  assignedByUserId?: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
