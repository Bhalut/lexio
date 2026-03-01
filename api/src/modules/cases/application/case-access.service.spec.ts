import { ForbiddenException } from '@nestjs/common';

import { AuditService } from '../../audit/application/audit.service';
import {
  AuditActionType,
  AuditEntityType,
} from '../../audit/domain/audit-event.entity';
import { AppUser, AppUserRole } from '../../users/domain/app-user.entity';
import { CaseAccessService } from './case-access.service';
import { CaseAssignment, CaseAccessLevel } from '../domain/case-assignment.entity';
import { CaseFile } from '../domain/case-file.entity';

type MockRepo = {
  create: jest.Mock;
  delete: jest.Mock;
  find: jest.Mock;
  findOne: jest.Mock;
  save: jest.Mock;
};

function createMockRepo(): MockRepo {
  return {
    create: jest.fn((value) => value),
    delete: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
  };
}

describe('CaseAccessService', () => {
  let caseRepository: MockRepo;
  let assignmentRepository: MockRepo;
  let userRepository: MockRepo;
  let auditService: jest.Mocked<AuditService>;
  let service: CaseAccessService;

  beforeEach(() => {
    caseRepository = createMockRepo();
    assignmentRepository = createMockRepo();
    userRepository = createMockRepo();
    auditService = {
      listCaseAssignmentHistoryForUser: jest.fn(),
      logEvent: jest.fn(),
    } as unknown as jest.Mocked<AuditService>;

    service = new CaseAccessService(
      caseRepository as never,
      assignmentRepository as never,
      userRepository as never,
      auditService,
    );
  });

  it('grants owner access to platform administrators', async () => {
    caseRepository.findOne.mockResolvedValue({ id: 'case-1' } as CaseFile);

    const result = await service.assertCaseAccess(
      'case-1',
      {
        id: 'admin-1',
        roleKey: AppUserRole.PLATFORM_ADMIN,
      } as AppUser,
      CaseAccessLevel.VIEWER,
    );

    expect(result).toBe(CaseAccessLevel.OWNER);
    expect(assignmentRepository.findOne).not.toHaveBeenCalled();
  });

  it('rejects actions above the assigned case access level', async () => {
    caseRepository.findOne.mockResolvedValue({ id: 'case-1' } as CaseFile);
    assignmentRepository.findOne.mockResolvedValue({
      caseId: 'case-1',
      userId: 'user-1',
      accessLevel: CaseAccessLevel.REVIEWER,
    } as CaseAssignment);

    await expect(
      service.assertCaseAccess(
        'case-1',
        {
          id: 'user-1',
          roleKey: AppUserRole.LEGAL_REVIEWER,
        } as AppUser,
        CaseAccessLevel.EDITOR,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('logs an audit event when creating a case assignment', async () => {
    userRepository.findOne.mockResolvedValue({
      id: 'user-1',
      fullName: 'Ana Ramirez',
    } as AppUser);
    caseRepository.findOne.mockResolvedValue({
      id: 'case-1',
      caseNumber: 'LEX-001',
      clientName: 'Cliente Demo',
    } as CaseFile);
    assignmentRepository.findOne.mockResolvedValue(null);
    assignmentRepository.save.mockImplementation(async (assignment) => ({
      id: 'assignment-1',
      ...assignment,
    }));

    const result = await service.upsertAssignment({
      userId: 'user-1',
      caseId: 'case-1',
      accessLevel: CaseAccessLevel.EDITOR,
      assignedByUserId: 'admin-1',
      assignedByName: 'Carlos Mendoza',
      correlationId: 'corr-1',
    });

    expect(result).toMatchObject({
      id: 'assignment-1',
      caseId: 'case-1',
      userId: 'user-1',
      accessLevel: CaseAccessLevel.EDITOR,
    });
    expect(auditService.logEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        actionType: AuditActionType.CASE_ASSIGNMENT_CREATED,
        entityType: AuditEntityType.CASE_ASSIGNMENT,
        caseId: 'case-1',
        targetUserId: 'user-1',
      }),
    );
  });
});
