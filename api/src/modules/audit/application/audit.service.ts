import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AuditEvent, AuditActionType, AuditEntityType } from '../domain/audit-event.entity';

export interface CreateAuditEventInput {
  actionType: AuditActionType;
  entityType: AuditEntityType;
  entityId: string;
  summary: string;
  caseId?: string | null;
  targetUserId?: string | null;
  actorUserId?: string | null;
  actorName?: string | null;
  correlationId?: string | null;
  metadata?: Record<string, unknown> | null;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditEvent)
    private readonly auditRepository: Repository<AuditEvent>,
  ) {}

  async logEvent(input: CreateAuditEventInput): Promise<AuditEvent> {
    return this.auditRepository.save(
      this.auditRepository.create({
        actionType: input.actionType,
        entityType: input.entityType,
        entityId: input.entityId,
        summary: input.summary,
        caseId: input.caseId || null,
        targetUserId: input.targetUserId || null,
        actorUserId: input.actorUserId || null,
        actorName: input.actorName || null,
        correlationId: input.correlationId || null,
        metadata: input.metadata || null,
      }),
    );
  }

  async listCaseAssignmentHistoryForUser(userId: string): Promise<AuditEvent[]> {
    return this.auditRepository.find({
      where: {
        targetUserId: userId,
        entityType: AuditEntityType.CASE_ASSIGNMENT,
      },
      order: {
        createdAt: 'DESC',
      },
      take: 50,
    });
  }
}
