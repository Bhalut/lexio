import { DocumentDelivery } from '../domain/models/document-delivery.model';

export const DOCUMENT_DELIVERY_REPOSITORY = Symbol('DOCUMENT_DELIVERY_REPOSITORY');

export interface DocumentDeliveryRepository {
  save(delivery: DocumentDelivery): Promise<DocumentDelivery>;
  findByCaseId(caseId: string): Promise<DocumentDelivery[]>;
}
