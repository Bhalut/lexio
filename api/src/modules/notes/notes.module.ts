import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';

import { CaseNote } from './domain/case-note.entity';
import { NotesController } from './adapters/notes.controller';
import { NotesService } from './application/notes.service';
import { CasesModule } from '../cases/cases.module';
import { ActivityModule } from '../activity/activity.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CaseNote]),
    CasesModule,
    ActivityModule,
    forwardRef(() => AuthModule),
  ],
  controllers: [NotesController],
  providers: [NotesService],
  exports: [NotesService],
})
export class NotesModule {}
