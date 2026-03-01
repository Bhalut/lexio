export enum CaseStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
  SUSPENDED = 'SUSPENDED',
  CLOSED = 'CLOSED',
}

export interface CaseHeaderDto {
  id: string;
  caseNumber: string;
  clientName: string;
  status: CaseStatus;
  stage: string;
  responsibleUserName: string;
  nextHearingDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentFileDto {
  id: string;
  deliveryId: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  checksum: string;
  uploadedAt: string;
}

export interface DocumentDeliveryDto {
  id: string;
  caseId: string;
  title: string;
  description: string;
  category: string;
  relatedPhase: string;
  createdByUserId?: string | null;
  createdByName: string;
  documents: DocumentFileDto[];
  createdAt: string;
}

export interface UploadProgressEvent {
  type: 'progress' | 'complete';
  percent: number;
  body?: DocumentDeliveryDto;
}

export interface StoragePort {
  save(key: string, data: Buffer): Promise<string>;
  get(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
}

export const STORAGE_PORT = Symbol('STORAGE_PORT');
