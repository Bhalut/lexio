import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ActivityModule } from '../activity/activity.module';
import { AuthModule } from '../auth/auth.module';
import { CaseFile } from '../cases/domain/case-file.entity';
import { CasesModule } from '../cases/cases.module';
import { PartiesController } from './adapters/parties.controller';
import { PartiesService } from './application/parties.service';
import { CaseParty } from './domain/case-party.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([CaseParty, CaseFile]),
    ActivityModule,
    CasesModule,
    forwardRef(() => AuthModule),
  ],
  controllers: [PartiesController],
  providers: [PartiesService],
})
export class PartiesModule {}
