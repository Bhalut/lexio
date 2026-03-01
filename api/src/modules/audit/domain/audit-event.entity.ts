import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum AuditActionType {
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_PASSWORD_RESET = 'USER_PASSWORD_RESET',
  CASE_ASSIGNMENT_CREATED = 'CASE_ASSIGNMENT_CREATED',
  CASE_ASSIGNMENT_UPDATED = 'CASE_ASSIGNMENT_UPDATED',
  CASE_ASSIGNMENT_REMOVED = 'CASE_ASSIGNMENT_REMOVED',
}

export enum AuditEntityType {
  USER = 'USER',
  CASE_ASSIGNMENT = 'CASE_ASSIGNMENT',
}

@Entity('audit_events')
export class AuditEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('IDX_audit_events_actionType')
  @Column({ type: 'varchar' })
  actionType!: AuditActionType;

  @Index('IDX_audit_events_entityType')
  @Column({ type: 'varchar' })
  entityType!: AuditEntityType;

  @Column({ type: 'uuid' })
  entityId!: string;

  @Index('IDX_audit_events_caseId')
  @Column({ type: 'uuid', nullable: true })
  caseId?: string | null;

  @Index('IDX_audit_events_targetUserId')
  @Column({ type: 'uuid', nullable: true })
  targetUserId?: string | null;

  @Column({ type: 'uuid', nullable: true })
  actorUserId?: string | null;

  @Column({ type: 'varchar', nullable: true })
  actorName?: string | null;

  @Column({ type: 'varchar', nullable: true })
  correlationId?: string | null;

  @Column({ type: 'text' })
  summary!: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt!: Date;
}
