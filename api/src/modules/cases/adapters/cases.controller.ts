import {
  Controller,
  Get,
  Param,
  NotFoundException,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';

import { CurrentUser } from '../../auth/current-user.decorator';
import { SessionAuthGuard } from '../../auth/session-auth.guard';
import { AppUser } from '../../users/domain/app-user.entity';
import { CaseAccessService } from '../application/case-access.service';
import { GetCaseUseCase, ListCasesUseCase } from '../application';
import { CaseAccessGuard } from '../case-access.guard';
import { CaseAccessLevel } from '../domain/case-assignment.entity';
import { RequireCaseAccess } from '../require-case-access.decorator';

@ApiTags('Cases')
@Controller('cases')
export class CasesController {
  constructor(
    private readonly getCase: GetCaseUseCase,
    private readonly listCases: ListCasesUseCase,
    private readonly caseAccessService: CaseAccessService,
  ) {}

  @Get()
  @UseGuards(SessionAuthGuard)
  @ApiOperation({ summary: 'List cases visible to the current user' })
  async list(@CurrentUser() currentUser: AppUser) {
    return this.listCases.execute(currentUser);
  }

  @Get(':caseId')
  @UseGuards(SessionAuthGuard, CaseAccessGuard)
  @RequireCaseAccess(CaseAccessLevel.VIEWER)
  @ApiOperation({ summary: 'Get case header information' })
  @ApiParam({ name: 'caseId', description: 'UUID of the case' })
  async findOne(
    @Param('caseId', ParseUUIDPipe) caseId: string,
    @CurrentUser() currentUser: AppUser,
  ) {
    const caseFile = await this.getCase.execute(caseId);

    if (!caseFile) {
      throw new NotFoundException(`Case ${caseId} not found`);
    }

    const currentUserAccessLevel = await this.caseAccessService.getCurrentAccessLevel(
      caseId,
      currentUser,
    );

    return {
      ...caseFile,
      currentUserAccessLevel,
    };
  }
}
