import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import {
  AuditActionType,
  AuditEntityType,
} from '../../audit/domain/audit-event.entity';
import { AuditService } from '../../audit/application/audit.service';
import { AppUser, AppUserRole } from '../../users/domain/app-user.entity';
import { CaseAssignment, CaseAccessLevel } from '../domain/case-assignment.entity';
import { CaseFile } from '../domain/case-file.entity';

const CASE_ACCESS_RANK: Record<CaseAccessLevel, number> = {
  [CaseAccessLevel.VIEWER]: 1,
  [CaseAccessLevel.REVIEWER]: 2,
  [CaseAccessLevel.EDITOR]: 3,
  [CaseAccessLevel.OWNER]: 4,
};

@Injectable()
export class CaseAccessService {
  constructor(
    @InjectRepository(CaseFile)
    private readonly caseRepository: Repository<CaseFile>,
    @InjectRepository(CaseAssignment)
    private readonly assignmentRepository: Repository<CaseAssignment>,
    @InjectRepository(AppUser)
    private readonly userRepository: Repository<AppUser>,
    private readonly auditService: AuditService,
  ) {}

  async listCasesForUser(currentUser: AppUser): Promise<
    Array<CaseFile & { currentUserAccessLevel: CaseAccessLevel }>
  > {
    if (currentUser.roleKey === AppUserRole.PLATFORM_ADMIN) {
      const cases = await this.caseRepository.find({
        order: {
          updatedAt: 'DESC',
          createdAt: 'DESC',
        },
      });

      return cases.map((caseFile) => ({
        ...caseFile,
        currentUserAccessLevel: CaseAccessLevel.OWNER,
      }));
    }

    const assignments = await this.assignmentRepository.find({
      where: { userId: currentUser.id },
      order: {
        updatedAt: 'DESC',
        createdAt: 'DESC',
      },
    });

    if (assignments.length === 0) {
      return [];
    }

    const cases = await this.caseRepository.find({
      where: { id: In(assignments.map((assignment) => assignment.caseId)) },
    });
    const casesById = new Map(cases.map((caseFile) => [caseFile.id, caseFile]));

    return assignments
      .map((assignment) => {
        const caseFile = casesById.get(assignment.caseId);
        if (!caseFile) {
          return null;
        }

        return {
          ...caseFile,
          currentUserAccessLevel: assignment.accessLevel,
        };
      })
      .filter(
        (
          entry,
        ): entry is CaseFile & { currentUserAccessLevel: CaseAccessLevel } =>
          Boolean(entry),
      );
  }

  async getCurrentAccessLevel(
    caseId: string,
    currentUser: AppUser,
  ): Promise<CaseAccessLevel | null> {
    if (currentUser.roleKey === AppUserRole.PLATFORM_ADMIN) {
      return CaseAccessLevel.OWNER;
    }

    const assignment = await this.assignmentRepository.findOne({
      where: { caseId, userId: currentUser.id },
    });

    return assignment?.accessLevel || null;
  }

  async assertCaseAccess(
    caseId: string,
    currentUser: AppUser,
    minimumAccessLevel: CaseAccessLevel,
  ): Promise<CaseAccessLevel> {
    const caseFile = await this.caseRepository.findOne({ where: { id: caseId } });
    if (!caseFile) {
      throw new NotFoundException(`Case with ID ${caseId} not found`);
    }

    if (currentUser.roleKey === AppUserRole.PLATFORM_ADMIN) {
      return CaseAccessLevel.OWNER;
    }

    const assignment = await this.assignmentRepository.findOne({
      where: { caseId, userId: currentUser.id },
    });

    if (!assignment) {
      throw new ForbiddenException(
        'The current account is not assigned to this case.',
      );
    }

    if (
      CASE_ACCESS_RANK[assignment.accessLevel] <
      CASE_ACCESS_RANK[minimumAccessLevel]
    ) {
      throw new ForbiddenException(
        'The current case assignment does not allow this action.',
      );
    }

    return assignment.accessLevel;
  }

  async listAssignmentsForUser(userId: string): Promise<CaseAssignment[]> {
    await this.ensureUserExists(userId);

    return this.assignmentRepository.find({
      where: { userId },
      order: {
        updatedAt: 'DESC',
        createdAt: 'DESC',
      },
    });
  }

  async listAssignmentHistoryForUser(userId: string) {
    await this.ensureUserExists(userId);
    return this.auditService.listCaseAssignmentHistoryForUser(userId);
  }

  async upsertAssignment(input: {
    userId: string;
    caseId: string;
    accessLevel: CaseAccessLevel;
    assignedByUserId?: string | null;
    assignedByName?: string | null;
    correlationId?: string | null;
  }): Promise<CaseAssignment> {
    const [targetUser, caseFile] = await Promise.all([
      this.ensureUserExists(input.userId),
      this.ensureCaseExists(input.caseId),
    ]);

    const existing = await this.assignmentRepository.findOne({
      where: { userId: input.userId, caseId: input.caseId },
    });

    if (existing) {
      const previousAccessLevel = existing.accessLevel;
      existing.accessLevel = input.accessLevel;
      existing.assignedByUserId = input.assignedByUserId || null;
      const savedAssignment = await this.assignmentRepository.save(existing);
      await this.auditService.logEvent({
        actionType: AuditActionType.CASE_ASSIGNMENT_UPDATED,
        entityType: AuditEntityType.CASE_ASSIGNMENT,
        entityId: savedAssignment.id,
        caseId: savedAssignment.caseId,
        targetUserId: savedAssignment.userId,
        actorUserId: input.assignedByUserId || null,
        actorName: input.assignedByName || null,
        correlationId: input.correlationId || null,
        summary: `${input.assignedByName || 'Sistema'} actualizó el acceso de ${targetUser.fullName} en ${caseFile.caseNumber}.`,
        metadata: {
          caseNumber: caseFile.caseNumber,
          clientName: caseFile.clientName,
          previousAccessLevel,
          nextAccessLevel: savedAssignment.accessLevel,
        },
      });
      return savedAssignment;
    }

    const savedAssignment = await this.assignmentRepository.save(
      this.assignmentRepository.create({
        userId: input.userId,
        caseId: input.caseId,
        accessLevel: input.accessLevel,
        assignedByUserId: input.assignedByUserId || null,
      }),
    );
    await this.auditService.logEvent({
      actionType: AuditActionType.CASE_ASSIGNMENT_CREATED,
      entityType: AuditEntityType.CASE_ASSIGNMENT,
      entityId: savedAssignment.id,
      caseId: savedAssignment.caseId,
      targetUserId: savedAssignment.userId,
      actorUserId: input.assignedByUserId || null,
      actorName: input.assignedByName || null,
      correlationId: input.correlationId || null,
      summary: `${input.assignedByName || 'Sistema'} asignó ${targetUser.fullName} al expediente ${caseFile.caseNumber}.`,
      metadata: {
        caseNumber: caseFile.caseNumber,
        clientName: caseFile.clientName,
        accessLevel: savedAssignment.accessLevel,
      },
    });
    return savedAssignment;
  }

  async deleteAssignment(
    userId: string,
    caseId: string,
    actor?: {
      actorUserId?: string | null;
      actorName?: string | null;
      correlationId?: string | null;
    },
  ): Promise<void> {
    const assignment = await this.assignmentRepository.findOne({
      where: { userId, caseId },
    });

    if (!assignment) {
      throw new NotFoundException(
        `Case assignment for user ${userId} and case ${caseId} not found`,
      );
    }

    const [targetUser, caseFile] = await Promise.all([
      this.ensureUserExists(userId),
      this.ensureCaseExists(caseId),
    ]);

    await this.assignmentRepository.delete({ id: assignment.id });
    await this.auditService.logEvent({
      actionType: AuditActionType.CASE_ASSIGNMENT_REMOVED,
      entityType: AuditEntityType.CASE_ASSIGNMENT,
      entityId: assignment.id,
      caseId,
      targetUserId: userId,
      actorUserId: actor?.actorUserId || null,
      actorName: actor?.actorName || null,
      correlationId: actor?.correlationId || null,
      summary: `${actor?.actorName || 'Sistema'} retiró a ${targetUser.fullName} del expediente ${caseFile.caseNumber}.`,
      metadata: {
        caseNumber: caseFile.caseNumber,
        clientName: caseFile.clientName,
        removedAccessLevel: assignment.accessLevel,
      },
    });
  }

  private async ensureUserExists(userId: string): Promise<AppUser> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    return user;
  }

  private async ensureCaseExists(caseId: string): Promise<CaseFile> {
    const caseFile = await this.caseRepository.findOne({ where: { id: caseId } });
    if (!caseFile) {
      throw new NotFoundException(`Case with ID ${caseId} not found`);
    }
    return caseFile;
  }
}
