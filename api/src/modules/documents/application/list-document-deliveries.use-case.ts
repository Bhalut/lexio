import { Inject, Injectable } from '@nestjs/common';

import { DocumentDelivery } from '../domain/models/document-delivery.model';
import {
  DOCUMENT_DELIVERY_REPOSITORY,
  DocumentDeliveryRepository,
} from '../ports/document-delivery.repository';

@Injectable()
export class ListDocumentDeliveriesUseCase {
  constructor(
    @Inject(DOCUMENT_DELIVERY_REPOSITORY)
    private readonly deliveryRepository: DocumentDeliveryRepository,
  ) {}

  async execute(caseId: string): Promise<DocumentDelivery[]> {
    return this.deliveryRepository.findByCaseId(caseId);
  }
}
