import { createHash } from 'crypto';

import { Test, TestingModule } from '@nestjs/testing';

import { CreateDocumentDeliveryUseCase } from './create-document-delivery.use-case';
import { DocumentDelivery } from '../domain/models/document-delivery.model';
import {
  DOCUMENT_DELIVERY_REPOSITORY,
  DocumentDeliveryRepository,
} from '../ports/document-delivery.repository';
import { STORAGE_PORT, StoragePort } from '../ports/storage.port';

describe('CreateDocumentDeliveryUseCase', () => {
  let useCase: CreateDocumentDeliveryUseCase;
  let deliveryRepository: jest.Mocked<DocumentDeliveryRepository>;
  let storage: jest.Mocked<StoragePort>;

  beforeEach(async () => {
    const mockDeliveryRepository = {
      save: jest.fn(),
      findByCaseId: jest.fn(),
    };

    const mockStorage: StoragePort = {
      save: jest.fn().mockResolvedValue(undefined),
      getUrl: jest.fn().mockReturnValue('http://example.test/document.pdf'),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateDocumentDeliveryUseCase,
        {
          provide: DOCUMENT_DELIVERY_REPOSITORY,
          useValue: mockDeliveryRepository,
        },
        { provide: STORAGE_PORT, useValue: mockStorage },
      ],
    }).compile();

    useCase = module.get(CreateDocumentDeliveryUseCase);
    deliveryRepository = module.get(DOCUMENT_DELIVERY_REPOSITORY);
    storage = module.get(STORAGE_PORT);
  });

  it('creates a delivery with persisted documents', async () => {
    const input = {
      caseId: 'case-123',
      title: 'Test Delivery',
      description: 'Test description',
      category: 'Pruebas documentales',
      relatedPhase: 'Fase probatoria',
      createdByUserId: 'user-123',
      createdByName: 'Test User',
      files: [
        {
          originalName: 'file1.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 1024,
          buffer: Buffer.from('fake-content'),
        },
        {
          originalName: 'file2.docx',
          mimeType: 'application/docx',
          sizeBytes: 2048,
          buffer: Buffer.from('fake-content-2'),
        },
      ],
    };

    deliveryRepository.save.mockImplementation(async (delivery) => delivery);

    await useCase.execute(input);

    expect(deliveryRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        caseId: 'case-123',
        title: 'Test Delivery',
        description: 'Test description',
      }),
    );
    expect(storage.save).toHaveBeenCalledTimes(2);
  });

  it('stores files under the delivery-specific storage path', async () => {
    const input = {
      caseId: 'case-abc',
      title: 'Evidence Delivery',
      description: 'Desc',
      category: 'Otros antecedentes',
      relatedPhase: 'Inicio del asunto',
      createdByUserId: 'user-abc',
      createdByName: 'User',
      files: [
        {
          originalName: 'evidence.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 512,
          buffer: Buffer.from('data'),
        },
      ],
    };

    deliveryRepository.save.mockImplementation(async (delivery) => delivery);

    await useCase.execute(input);

    expect(storage.save).toHaveBeenCalledWith(
      expect.stringContaining('case-abc/'),
      expect.any(Buffer),
    );
    expect(storage.save).toHaveBeenCalledWith(
      expect.stringContaining('/evidence.pdf'),
      expect.any(Buffer),
    );
  });

  it('computes SHA-256 checksum for each file', async () => {
    const fileContent = Buffer.from('test-file-content-for-checksum');
    const expectedChecksum = createHash('sha256')
      .update(fileContent)
      .digest('hex');

    const input = {
      caseId: 'case-checksum',
      title: 'Checksum Delivery',
      description: 'Verify checksums',
      category: 'Pruebas documentales',
      relatedPhase: 'Fase probatoria',
      createdByUserId: 'user-checksum',
      createdByName: 'User',
      files: [
        {
          originalName: 'doc.pdf',
          mimeType: 'application/pdf',
          sizeBytes: fileContent.length,
          buffer: fileContent,
        },
      ],
    };

    deliveryRepository.save.mockImplementation(async (delivery) => delivery);

    await useCase.execute(input);

    const savedCall =
      deliveryRepository.save.mock.calls[0][0] as DocumentDelivery;
    expect(savedCall.documents).toHaveLength(1);
    expect(savedCall.documents[0].checksum).toBe(expectedChecksum);
    expect(savedCall.documents[0].checksum).toHaveLength(64);
  });

  it('handles an empty file collection', async () => {
    const input = {
      caseId: 'case-empty',
      title: 'Empty Delivery',
      description: 'No files',
      category: 'Otros antecedentes',
      relatedPhase: 'Inicio del asunto',
      createdByUserId: 'user-empty',
      createdByName: 'User',
      files: [],
    };

    deliveryRepository.save.mockImplementation(async (delivery) => delivery);

    await useCase.execute(input);

    expect(storage.save).not.toHaveBeenCalled();
    expect(deliveryRepository.save).toHaveBeenCalled();
  });
});
