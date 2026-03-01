import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CaseActivity } from '../domain/case-activity.entity';
import { CreateActivityDto } from './activity.dto';
import { CaseFile } from '../../cases/domain/case-file.entity';

@Injectable()
export class ActivityService {
  constructor(
    @InjectRepository(CaseActivity)
    private readonly activityRepository: Repository<CaseActivity>,
    @InjectRepository(CaseFile)
    private readonly caseRepository: Repository<CaseFile>,
  ) {}

  async getActivitiesByCase(caseId: string): Promise<CaseActivity[]> {
    return this.activityRepository.find({
      where: { caseId },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async logActivity(caseId: string, dto: CreateActivityDto): Promise<CaseActivity> {
    const caseFile = await this.caseRepository.findOne({ where: { id: caseId } });
    if (!caseFile) {
      throw new NotFoundException(`Case with ID ${caseId} not found`);
    }

    const activity = this.activityRepository.create({
      caseId,
      ...dto,
    });
    return this.activityRepository.save(activity);
  }
}
