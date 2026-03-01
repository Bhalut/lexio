import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CaseFile } from '../domain/case-file.entity';

@Injectable()
export class GetCaseUseCase {
  constructor(
    @InjectRepository(CaseFile)
    private readonly caseRepo: Repository<CaseFile>,
  ) {}

  async execute(caseId: string): Promise<CaseFile | null> {
    return this.caseRepo.findOne({ where: { id: caseId } });
  }
}
