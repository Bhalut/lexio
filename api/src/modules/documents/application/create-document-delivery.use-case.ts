import { createHash, randomUUID } from 'crypto';

import { Inject, Injectable } from '@nestjs/common';

import { Document } from '../domain/models/document.model';
import { DocumentDelivery } from '../domain/models/document-delivery.model';
import {
  DOCUMENT_DELIVERY_REPOSITORY,
  DocumentDeliveryRepository,
} from '../ports/document-delivery.repository';
import { STORAGE_PORT, StoragePort } from '../ports/storage.port';

export interface CreateDocumentDeliveryInput {
  caseId: string;
  title: string;
  description: string;
  category: string;
  relatedPhase: string;
  createdByUserId: string;
  createdByName: string;
  files: Array<{
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    buffer: Buffer;
  }>;
}

@Injectable()
export class CreateDocumentDeliveryUseCase {
  constructor(
    @Inject(DOCUMENT_DELIVERY_REPOSITORY)
    private readonly deliveryRepository: DocumentDeliveryRepository,
    @Inject(STORAGE_PORT)
    private readonly storage: StoragePort,
  ) {}

  async execute(input: CreateDocumentDeliveryInput): Promise<DocumentDelivery> {
    const deliveryId = randomUUID();
    const documents: Document[] = [];

    for (const file of input.files) {
      const storageKey = `${input.caseId}/${deliveryId}/${file.originalName}`;
      const checksum = createHash('sha256').update(file.buffer).digest('hex');

      await this.storage.save(storageKey, file.buffer);

      documents.push(
        new Document(
          randomUUID(),
          deliveryId,
          file.originalName,
          file.mimeType,
          file.sizeBytes,
          storageKey,
          checksum,
          new Date(),
        ),
      );
    }

    const delivery = new DocumentDelivery(
      deliveryId,
      input.caseId,
      input.title,
      input.description,
      input.category,
      input.relatedPhase,
      input.createdByUserId,
      input.createdByName,
      new Date(),
      documents,
    );

    return this.deliveryRepository.save(delivery);
  }
}
