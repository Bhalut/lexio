import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ActivityService } from '../../activity/application/activity.service';
import { ActivityType } from '../../activity/domain/case-activity.entity';
import { CaseNote } from '../domain/case-note.entity';
import { CreateNoteDto, UpdateNoteDto } from './note.dto';
import { CaseFile } from '../../cases/domain/case-file.entity';
import { AppUser } from '../../users/domain/app-user.entity';

@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(CaseNote)
    private readonly noteRepository: Repository<CaseNote>,
    @InjectRepository(CaseFile)
    private readonly caseRepository: Repository<CaseFile>,
    private readonly activityService: ActivityService,
  ) {}

  async getNotesByCase(caseId: string): Promise<CaseNote[]> {
    return this.noteRepository.find({
      where: { caseId },
      order: {
        isPinned: 'DESC',
        createdAt: 'DESC',
      },
    });
  }

  async createNote(
    caseId: string,
    dto: CreateNoteDto,
    currentUser: AppUser,
  ): Promise<CaseNote> {
    const caseFile = await this.caseRepository.findOne({ where: { id: caseId } });
    if (!caseFile) {
      throw new NotFoundException(`Case with ID ${caseId} not found`);
    }

    const note = this.noteRepository.create({
      caseId,
      content: dto.content,
      isPinned: dto.isPinned ?? false,
      authorName: currentUser.fullName,
      authorUserId: currentUser.id,
    });

    const savedNote = await this.noteRepository.save(note);

    await this.activityService.logActivity(caseId, {
      type: ActivityType.NOTE,
      description: 'Agregó una nota al expediente.',
      authorName: currentUser.fullName,
    });

    return savedNote;
  }

  async updateNote(id: string, dto: UpdateNoteDto): Promise<CaseNote> {
    const note = await this.noteRepository.findOne({ where: { id } });
    if (!note) {
      throw new NotFoundException(`Note with ID ${id} not found`);
    }

    Object.assign(note, dto);
    return this.noteRepository.save(note);
  }

  async deleteNote(id: string): Promise<void> {
    const result = await this.noteRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Note with ID ${id} not found`);
    }
  }
}
