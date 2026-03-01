import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  ParseUUIDPipe,
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
import { NotesService } from '../application/notes.service';
import { CreateNoteDto, UpdateNoteDto } from '../application/note.dto';

@Controller('cases/:caseId/notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get()
  @UseGuards(SessionAuthGuard, CaseAccessGuard)
  @RequireCaseAccess(CaseAccessLevel.VIEWER)
  async getNotes(@Param('caseId', ParseUUIDPipe) caseId: string) {
    return this.notesService.getNotesByCase(caseId);
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
  async createNote(
    @Param('caseId', ParseUUIDPipe) caseId: string,
    @Body() dto: CreateNoteDto,
    @CurrentUser() currentUser: AppUser,
  ) {
    return this.notesService.createNote(caseId, dto, currentUser);
  }

  @Patch(':noteId')
  @UseGuards(SessionAuthGuard, RolesGuard, CaseAccessGuard)
  @RequireRoles(
    AppUserRole.PLATFORM_ADMIN,
    AppUserRole.LEGAL_MANAGER,
    AppUserRole.LEGAL_OPERATOR,
    AppUserRole.LEGAL_REVIEWER,
  )
  @RequireCaseAccess(CaseAccessLevel.REVIEWER)
  async updateNote(
    @Param('noteId', ParseUUIDPipe) noteId: string,
    @Body() dto: UpdateNoteDto,
  ) {
    return this.notesService.updateNote(noteId, dto);
  }

  @Delete(':noteId')
  @UseGuards(SessionAuthGuard, RolesGuard, CaseAccessGuard)
  @RequireRoles(
    AppUserRole.PLATFORM_ADMIN,
    AppUserRole.LEGAL_MANAGER,
    AppUserRole.LEGAL_OPERATOR,
    AppUserRole.LEGAL_REVIEWER,
  )
  @RequireCaseAccess(CaseAccessLevel.REVIEWER)
  async deleteNote(@Param('noteId', ParseUUIDPipe) noteId: string) {
    await this.notesService.deleteNote(noteId);
    return { success: true };
  }
}
