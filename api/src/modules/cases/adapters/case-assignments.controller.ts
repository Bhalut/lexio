import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../../auth/current-user.decorator';
import { RequireRoles } from '../../auth/require-roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import { SessionAuthGuard } from '../../auth/session-auth.guard';
import { AuthRequest } from '../../auth/auth-request.type';
import { AppUser, AppUserRole } from '../../users/domain/app-user.entity';
import { CaseAccessService } from '../application/case-access.service';
import { UpsertCaseAssignmentDto } from '../application/case-assignment.dto';

@Controller('users/:userId/case-assignments')
@UseGuards(SessionAuthGuard, RolesGuard)
@RequireRoles(AppUserRole.PLATFORM_ADMIN)
export class CaseAssignmentsController {
  constructor(private readonly caseAccessService: CaseAccessService) {}

  @Get()
  async listAssignments(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.caseAccessService.listAssignmentsForUser(userId);
  }

  @Get('events')
  async listAssignmentEvents(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.caseAccessService.listAssignmentHistoryForUser(userId);
  }

  @Put(':caseId')
  async upsertAssignment(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('caseId', ParseUUIDPipe) caseId: string,
    @Body() dto: UpsertCaseAssignmentDto,
    @CurrentUser() currentUser: AppUser,
    @Req() request: AuthRequest,
  ) {
    return this.caseAccessService.upsertAssignment({
      userId,
      caseId,
      accessLevel: dto.accessLevel,
      assignedByUserId: currentUser.id,
      assignedByName: currentUser.fullName,
      correlationId: request.correlationId || null,
    });
  }

  @Delete(':caseId')
  async deleteAssignment(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('caseId', ParseUUIDPipe) caseId: string,
    @CurrentUser() currentUser: AppUser,
    @Req() request: AuthRequest,
  ) {
    await this.caseAccessService.deleteAssignment(userId, caseId, {
      actorUserId: currentUser.id,
      actorName: currentUser.fullName,
      correlationId: request.correlationId || null,
    });
    return { success: true };
  }
}
