import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../auth/current-user.decorator';
import { RequireRoles } from '../../auth/require-roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import { SessionAuthGuard } from '../../auth/session-auth.guard';
import { AppUser, AppUserRole } from '../../users/domain/app-user.entity';
import { CaseAccessGuard } from '../../cases/case-access.guard';
import { CaseAccessLevel } from '../../cases/domain/case-assignment.entity';
import { RequireCaseAccess } from '../../cases/require-case-access.decorator';
import { ActivityService } from '../application/activity.service';
import { CreateActivityDto } from '../application/activity.dto';

@Controller('cases/:caseId/activities')
export class ActivitiesController {
  constructor(private readonly activityService: ActivityService) {}

  @Get()
  @UseGuards(SessionAuthGuard, CaseAccessGuard)
  @RequireCaseAccess(CaseAccessLevel.VIEWER)
  async getActivities(@Param('caseId', ParseUUIDPipe) caseId: string) {
    return this.activityService.getActivitiesByCase(caseId);
  }

  @Post()
  @UseGuards(SessionAuthGuard, RolesGuard, CaseAccessGuard)
  @RequireRoles(
    AppUserRole.PLATFORM_ADMIN,
    AppUserRole.LEGAL_MANAGER,
    AppUserRole.LEGAL_OPERATOR,
    AppUserRole.LEGAL_REVIEWER,
  )
  @RequireCaseAccess(CaseAccessLevel.REVIEWER)
  async logActivity(
    @Param('caseId', ParseUUIDPipe) caseId: string,
    @Body() dto: CreateActivityDto,
    @CurrentUser() currentUser: AppUser,
  ) {
    return this.activityService.logActivity(caseId, {
      ...dto,
      authorName: dto.authorName || currentUser.fullName,
    });
  }
}
