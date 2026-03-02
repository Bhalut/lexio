import { DocumentDelivery } from '../../shared/services/api.service';
import {
  filterDocuments,
  formatSize,
  getTotalSize,
} from './workspace.presenter';
import { FlatDocument } from './components/document/row.component';

describe('workspace.presenter', () => {
  it('sorts documents by size using runtime-safe numeric coercion', () => {
    const documents = [
      createDocument({
        id: 'doc-1',
        originalName: 'small.pdf',
        sizeBytes: 512,
      }),
      createDocument({
        id: 'doc-2',
        originalName: 'large.pdf',
        sizeBytes: '4096' as unknown as number,
      }),
      createDocument({
        id: 'doc-3',
        originalName: 'unknown.pdf',
        sizeBytes: Number.NaN,
      }),
    ];

    const result = filterDocuments(documents, {
      searchQuery: '',
      selectedCategory: 'all',
      selectedPhase: 'all',
      sortMode: 'size',
    });

    expect(result.map((document) => document.id)).toEqual([
      'doc-2',
      'doc-1',
      'doc-3',
    ]);
  });

  it('treats invalid file sizes as zero in totals and formatting', () => {
    expect(
      getTotalSize([
        createDocument({ id: 'doc-1', sizeBytes: 1024 }),
        createDocument({ id: 'doc-2', sizeBytes: Number.NaN }),
      ]),
    ).toBe('1.0 KB');
    expect(formatSize(Number.NaN)).toBe('0 B');
  });
});

function createDocument(overrides: Partial<FlatDocument>): FlatDocument {
  const delivery = createDelivery();
  return {
    id: overrides.id ?? 'doc-default',
    originalName: overrides.originalName ?? 'document.pdf',
    mimeType: overrides.mimeType ?? 'application/pdf',
    sizeBytes: overrides.sizeBytes ?? 1024,
    uploadedAt: overrides.uploadedAt ?? '2026-03-01T00:00:00.000Z',
    deliveryId: overrides.deliveryId ?? delivery.id,
    deliveryTitle: overrides.deliveryTitle ?? delivery.title,
    deliveryDescription: overrides.deliveryDescription ?? delivery.description,
    deliveryCategory: overrides.deliveryCategory ?? delivery.category,
    deliveryRelatedPhase:
      overrides.deliveryRelatedPhase ?? delivery.relatedPhase,
    createdByName: overrides.createdByName ?? delivery.createdByName,
    deliveryCreatedAt: overrides.deliveryCreatedAt ?? delivery.createdAt,
  };
}

function createDelivery(): DocumentDelivery {
  return {
    id: 'delivery-1',
    caseId: 'case-1',
    title: 'Entrega principal',
    description: 'Documentos iniciales',
    category: 'Pruebas documentales',
    relatedPhase: 'Fase probatoria',
    createdByName: 'Carlos Mendoza',
    documents: [],
    createdAt: '2026-03-01T00:00:00.000Z',
  };
}
