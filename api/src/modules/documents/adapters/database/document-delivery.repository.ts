import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { DocumentDelivery } from '../../domain/models/document-delivery.model';
import { DocumentDeliveryRepository } from '../../ports/document-delivery.repository';
import { DocumentDeliveryOrmEntity } from './entities/document-delivery.orm-entity';

@Injectable()
export class DocumentDeliveryRepositoryImpl implements DocumentDeliveryRepository {
  constructor(
    @InjectRepository(DocumentDeliveryOrmEntity)
    private readonly ormRepository: Repository<DocumentDeliveryOrmEntity>,
  ) {}

  async save(delivery: DocumentDelivery): Promise<DocumentDelivery> {
    const ormEntity = DocumentDeliveryOrmEntity.fromDomain(delivery);
    const savedOrmEntity = await this.ormRepository.save(ormEntity);
    return DocumentDeliveryOrmEntity.toDomain(savedOrmEntity);
  }

  async findByCaseId(caseId: string): Promise<DocumentDelivery[]> {
    const ormEntities = await this.ormRepository.find({
      where: { caseId },
      order: { createdAt: 'DESC' },
      relations: ['documents'],
    });

    return ormEntities.map(DocumentDeliveryOrmEntity.toDomain);
  }
}
