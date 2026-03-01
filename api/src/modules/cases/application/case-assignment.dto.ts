import { IsEnum } from 'class-validator';

import { CaseAccessLevel } from '../domain/case-assignment.entity';

export class UpsertCaseAssignmentDto {
  @IsEnum(CaseAccessLevel)
  accessLevel!: CaseAccessLevel;
}
