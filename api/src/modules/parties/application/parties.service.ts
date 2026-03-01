import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { ActivityService } from '../../activity/application/activity.service';
import { ActivityType } from '../../activity/domain/case-activity.entity';
import { CaseFile } from '../../cases/domain/case-file.entity';
import { AppUser } from '../../users/domain/app-user.entity';
import {
  CreatePartyDto,
  ReorderPartiesDto,
  UpdatePartyDto,
} from './party.dto';
import { CaseParty } from '../domain/case-party.entity';

@Injectable()
export class PartiesService {
  constructor(
    @InjectRepository(CaseParty)
    private readonly partyRepository: Repository<CaseParty>,
    @InjectRepository(CaseFile)
    private readonly caseRepository: Repository<CaseFile>,
    private readonly activityService: ActivityService,
  ) {}

  async getPartiesByCase(caseId: string): Promise<CaseParty[]> {
    const caseFile = await this.caseRepository.findOne({ where: { id: caseId } });
    if (!caseFile) {
      throw new NotFoundException(`Case with ID ${caseId} not found`);
    }

    return this.partyRepository.find({
      where: { caseId },
      order: {
        sortOrder: 'ASC',
        createdAt: 'ASC',
      },
    });
  }

  async createParty(
    caseId: string,
    dto: CreatePartyDto,
    currentUser: AppUser,
  ): Promise<CaseParty> {
    const caseFile = await this.caseRepository.findOne({ where: { id: caseId } });
    if (!caseFile) {
      throw new NotFoundException(`Case with ID ${caseId} not found`);
    }

    const party = this.partyRepository.create({
      caseId,
      role: dto.role,
      name: dto.name,
      detail: dto.detail,
      sortOrder: dto.sortOrder ?? 0,
    });
    const savedParty = await this.partyRepository.save(party);

    await this.activityService.logActivity(caseId, {
      type: ActivityType.PARTY_ADDED,
      description: `Registró la parte "${savedParty.name}" como ${savedParty.role}.`,
      authorName: currentUser.fullName,
    });

    return savedParty;
  }

  async updateParty(
    caseId: string,
    partyId: string,
    dto: UpdatePartyDto,
    currentUser: AppUser,
  ): Promise<CaseParty> {
    const party = await this.partyRepository.findOne({
      where: { id: partyId, caseId },
    });
    if (!party) {
      throw new NotFoundException(`Party with ID ${partyId} not found`);
    }

    Object.assign(party, dto);
    const savedParty = await this.partyRepository.save(party);

    await this.activityService.logActivity(caseId, {
      type: ActivityType.PARTY_UPDATED,
      description: `Actualizó los datos de la parte "${savedParty.name}".`,
      authorName: currentUser.fullName,
    });

    return savedParty;
  }

  async deleteParty(
    caseId: string,
    partyId: string,
    currentUser: AppUser,
  ): Promise<void> {
    const party = await this.partyRepository.findOne({
      where: { id: partyId, caseId },
    });
    if (!party) {
      throw new NotFoundException(`Party with ID ${partyId} not found`);
    }

    await this.partyRepository.delete({ id: partyId, caseId });

    await this.activityService.logActivity(caseId, {
      type: ActivityType.PARTY_REMOVED,
      description: `Eliminó la parte "${party.name}".`,
      authorName: currentUser.fullName,
    });
  }

  async reorderParties(
    caseId: string,
    dto: ReorderPartiesDto,
    currentUser: AppUser,
  ): Promise<CaseParty[]> {
    const parties = await this.partyRepository.find({
      where: {
        caseId,
        id: In(dto.items.map((item) => item.id)),
      },
    });

    if (parties.length !== dto.items.length) {
      throw new NotFoundException('One or more parties were not found.');
    }

    const orderMap = new Map(dto.items.map((item) => [item.id, item.sortOrder]));
    for (const party of parties) {
      party.sortOrder = orderMap.get(party.id) ?? party.sortOrder;
    }

    await this.partyRepository.save(parties);

    await this.activityService.logActivity(caseId, {
      type: ActivityType.PARTY_UPDATED,
      description: 'Reordenó las partes del expediente.',
      authorName: currentUser.fullName,
    });

    return this.getPartiesByCase(caseId);
  }
}
