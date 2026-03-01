import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { AppUser } from '../users/domain/app-user.entity';
import { CaseAccessGuard } from './case-access.guard';
import { CaseAssignmentsController } from './adapters/case-assignments.controller';
import { CaseAccessService } from './application/case-access.service';
import { CaseFile } from './domain/case-file.entity';
import { CasesController } from './adapters/cases.controller';
import { CaseAssignment } from './domain/case-assignment.entity';
import { GetCaseUseCase, ListCasesUseCase } from './application';

@Module({
  imports: [
    TypeOrmModule.forFeature([CaseFile, CaseAssignment, AppUser]),
    AuditModule,
    AuthModule,
  ],
  controllers: [CasesController, CaseAssignmentsController],
  providers: [GetCaseUseCase, ListCasesUseCase, CaseAccessService, CaseAccessGuard],
  exports: [TypeOrmModule, CaseAccessService, CaseAccessGuard],
})
export class CasesModule {}
