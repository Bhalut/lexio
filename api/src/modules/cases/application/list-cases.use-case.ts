import { Injectable } from '@nestjs/common';

import { AppUser } from '../../users/domain/app-user.entity';
import { CaseAccessService } from './case-access.service';
import { CaseAccessLevel } from '../domain/case-assignment.entity';
import { CaseFile } from '../domain/case-file.entity';

@Injectable()
export class ListCasesUseCase {
  constructor(private readonly caseAccessService: CaseAccessService) {}

  async execute(
    currentUser: AppUser,
  ): Promise<Array<CaseFile & { currentUserAccessLevel: CaseAccessLevel }>> {
    return this.caseAccessService.listCasesForUser(currentUser);
  }
}
