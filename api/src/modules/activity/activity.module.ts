import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ActivitiesController } from './adapters/activities.controller';
import { AuthModule } from '../auth/auth.module';
import { CasesModule } from '../cases/cases.module';
import { CaseActivity } from './domain/case-activity.entity';
import { ActivityService } from './application/activity.service';

@Module({
  imports: [TypeOrmModule.forFeature([CaseActivity]), CasesModule, AuthModule],
  controllers: [ActivitiesController],
  providers: [ActivityService],
  exports: [ActivityService],
})
export class ActivityModule {}
