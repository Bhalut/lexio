import { SetMetadata } from '@nestjs/common';

import { CaseAccessLevel } from './domain/case-assignment.entity';

export const REQUIRED_CASE_ACCESS_KEY = 'requiredCaseAccessLevel';

export const RequireCaseAccess = (accessLevel: CaseAccessLevel) =>
  SetMetadata(REQUIRED_CASE_ACCESS_KEY, accessLevel);
