import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../../auth/current-user.decorator';
import { RequireRoles } from '../../auth/require-roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import { SessionAuthGuard } from '../../auth/session-auth.guard';
import { CaseAccessGuard } from '../../cases/case-access.guard';
import { CaseAccessLevel } from '../../cases/domain/case-assignment.entity';
import { RequireCaseAccess } from '../../cases/require-case-access.decorator';
import { AppUser, AppUserRole } from '../../users/domain/app-user.entity';
import {
  CreatePartyDto,
  ReorderPartiesDto,
  UpdatePartyDto,
} from '../application/party.dto';
import { PartiesService } from '../application/parties.service';

@Controller('cases/:caseId/parties')
export class PartiesController {
  constructor(private readonly partiesService: PartiesService) {}

  @Get()
  @UseGuards(SessionAuthGuard, CaseAccessGuard)
  @RequireCaseAccess(CaseAccessLevel.VIEWER)
  async getParties(@Param('caseId', ParseUUIDPipe) caseId: string) {
    return this.partiesService.getPartiesByCase(caseId);
  }

  @Post()
  @UseGuards(SessionAuthGuard, RolesGuard, CaseAccessGuard)
  @RequireRoles(
    AppUserRole.PLATFORM_ADMIN,
    AppUserRole.LEGAL_MANAGER,
    AppUserRole.LEGAL_OPERATOR,
  )
  @RequireCaseAccess(CaseAccessLevel.EDITOR)
  async createParty(
    @Param('caseId', ParseUUIDPipe) caseId: string,
    @Body() dto: CreatePartyDto,
    @CurrentUser() currentUser: AppUser,
  ) {
    return this.partiesService.createParty(caseId, dto, currentUser);
  }

  @Patch('order')
  @UseGuards(SessionAuthGuard, RolesGuard, CaseAccessGuard)
  @RequireRoles(
    AppUserRole.PLATFORM_ADMIN,
    AppUserRole.LEGAL_MANAGER,
    AppUserRole.LEGAL_OPERATOR,
  )
  @RequireCaseAccess(CaseAccessLevel.EDITOR)
  async updatePartyOrder(
    @Param('caseId', ParseUUIDPipe) caseId: string,
    @Body() dto: ReorderPartiesDto,
    @CurrentUser() currentUser: AppUser,
  ) {
    return this.partiesService.reorderParties(caseId, dto, currentUser);
  }

  @Patch(':partyId')
  @UseGuards(SessionAuthGuard, RolesGuard, CaseAccessGuard)
  @RequireRoles(
    AppUserRole.PLATFORM_ADMIN,
    AppUserRole.LEGAL_MANAGER,
    AppUserRole.LEGAL_OPERATOR,
  )
  @RequireCaseAccess(CaseAccessLevel.EDITOR)
  async updateParty(
    @Param('caseId', ParseUUIDPipe) caseId: string,
    @Param('partyId', ParseUUIDPipe) partyId: string,
    @Body() dto: UpdatePartyDto,
    @CurrentUser() currentUser: AppUser,
  ) {
    return this.partiesService.updateParty(caseId, partyId, dto, currentUser);
  }

  @Delete(':partyId')
  @UseGuards(SessionAuthGuard, RolesGuard, CaseAccessGuard)
  @RequireRoles(
    AppUserRole.PLATFORM_ADMIN,
    AppUserRole.LEGAL_MANAGER,
    AppUserRole.LEGAL_OPERATOR,
  )
  @RequireCaseAccess(CaseAccessLevel.EDITOR)
  async deleteParty(
    @Param('caseId', ParseUUIDPipe) caseId: string,
    @Param('partyId', ParseUUIDPipe) partyId: string,
    @CurrentUser() currentUser: AppUser,
  ) {
    await this.partiesService.deleteParty(caseId, partyId, currentUser);
    return { success: true };
  }
}
