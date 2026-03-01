import { Test, TestingModule } from '@nestjs/testing';

import { ListDocumentDeliveriesUseCase } from './list-document-deliveries.use-case';
import { DocumentDelivery } from '../domain/models/document-delivery.model';
import {
  DOCUMENT_DELIVERY_REPOSITORY,
  DocumentDeliveryRepository,
} from '../ports/document-delivery.repository';

describe('ListDocumentDeliveriesUseCase', () => {
  let useCase: ListDocumentDeliveriesUseCase;
  let deliveryRepository: jest.Mocked<DocumentDeliveryRepository>;

  beforeEach(async () => {
    const mockDeliveryRepository = {
      save: jest.fn(),
      findByCaseId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListDocumentDeliveriesUseCase,
        {
          provide: DOCUMENT_DELIVERY_REPOSITORY,
          useValue: mockDeliveryRepository,
        },
      ],
    }).compile();

    useCase = module.get(ListDocumentDeliveriesUseCase);
    deliveryRepository = module.get(DOCUMENT_DELIVERY_REPOSITORY);
  });

  it('returns deliveries ordered by createdAt desc via the repository port', async () => {
    const mockDeliveries: DocumentDelivery[] = [
      {
        id: '1',
        title: 'Newest',
        createdAt: new Date('2026-02-26'),
      } as DocumentDelivery,
      {
        id: '2',
        title: 'Older',
        createdAt: new Date('2026-02-25'),
      } as DocumentDelivery,
    ];

    deliveryRepository.findByCaseId.mockResolvedValue(mockDeliveries);

    const result = await useCase.execute('case-123');

    expect(deliveryRepository.findByCaseId).toHaveBeenCalledWith('case-123');
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe('Newest');
  });

  it('returns an empty array when the case has no deliveries', async () => {
    deliveryRepository.findByCaseId.mockResolvedValue([]);

    const result = await useCase.execute('case-empty');

    expect(result).toEqual([]);
  });
});
