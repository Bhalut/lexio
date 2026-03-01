import { DocumentDelivery } from '../../shared/services/api.service';
import { FlatDocument } from './components/document/row.component';

export type SortMode = 'newest' | 'name' | 'type' | 'size';

export interface DocumentLibraryFilters {
  searchQuery: string;
  selectedCategory: string;
  selectedPhase: string;
  sortMode: SortMode;
}

export function flattenDocuments(deliveries: DocumentDelivery[]): FlatDocument[] {
  return deliveries.flatMap((delivery) =>
    (delivery.documents || []).map((document) => ({
      id: document.id,
      originalName: document.originalName,
      mimeType: document.mimeType,
      sizeBytes: document.sizeBytes,
      uploadedAt: document.uploadedAt,
      deliveryId: delivery.id,
      deliveryTitle: delivery.title,
      deliveryDescription: delivery.description,
      deliveryCategory: delivery.category,
      deliveryRelatedPhase: delivery.relatedPhase,
      createdByName: delivery.createdByName,
      deliveryCreatedAt: delivery.createdAt,
    })),
  );
}

export function filterDocuments(
  allDocuments: FlatDocument[],
  filters: DocumentLibraryFilters,
): FlatDocument[] {
  let result = [...allDocuments];
  const query = filters.searchQuery.trim().toLowerCase();

  if (query) {
    result = result.filter(
      (document) =>
        document.originalName.toLowerCase().includes(query) ||
        document.deliveryTitle.toLowerCase().includes(query) ||
        document.deliveryDescription.toLowerCase().includes(query) ||
        document.createdByName.toLowerCase().includes(query),
    );
  }

  if (filters.selectedCategory !== 'all') {
    result = result.filter(
      (document) => document.deliveryCategory === filters.selectedCategory,
    );
  }

  if (filters.selectedPhase !== 'all') {
    result = result.filter(
      (document) => document.deliveryRelatedPhase === filters.selectedPhase,
    );
  }

  switch (filters.sortMode) {
    case 'newest':
      result.sort(
        (left, right) =>
          new Date(right.deliveryCreatedAt).getTime() -
          new Date(left.deliveryCreatedAt).getTime(),
      );
      break;
    case 'name':
      result.sort((left, right) =>
        left.originalName.localeCompare(right.originalName, 'es'),
      );
      break;
    case 'type':
      result.sort((left, right) =>
        getTypeLabel(left.mimeType).localeCompare(
          getTypeLabel(right.mimeType),
          'es',
        ),
      );
      break;
    case 'size':
      result.sort((left, right) => right.sizeBytes - left.sizeBytes);
      break;
  }

  return result;
}

export function filterDeliveries(
  deliveries: DocumentDelivery[],
  historyCategory: string,
  historyPhase: string,
): DocumentDelivery[] {
  return deliveries.filter((delivery) => {
    if (historyCategory !== 'all' && delivery.category !== historyCategory) {
      return false;
    }

    if (historyPhase !== 'all' && delivery.relatedPhase !== historyPhase) {
      return false;
    }

    return true;
  });
}

export function hasActiveLibraryFilters(filters: DocumentLibraryFilters): boolean {
  return (
    filters.searchQuery.trim().length > 0 ||
    filters.selectedCategory !== 'all' ||
    filters.selectedPhase !== 'all'
  );
}

export function hasActiveHistoryFilters(
  historyCategory: string,
  historyPhase: string,
): boolean {
  return historyCategory !== 'all' || historyPhase !== 'all';
}

export function getTypeBreakdown(filteredDocuments: FlatDocument[]): string {
  if (filteredDocuments.length === 0) {
    return 'Sin documentos';
  }

  const counts = new Map<string, number>();
  for (const document of filteredDocuments) {
    const label = getTypeLabel(document.mimeType);
    counts.set(label, (counts.get(label) || 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([label, count]) => `${count} ${label}`)
    .join(' · ');
}

export function getFilteredSummary(
  filteredDocuments: FlatDocument[],
  allDocuments: FlatDocument[],
  filters: DocumentLibraryFilters,
): string {
  if (!hasActiveLibraryFilters(filters)) {
    return `${filteredDocuments.length} archivo${filteredDocuments.length === 1 ? '' : 's'}`;
  }

  return `${filteredDocuments.length} de ${allDocuments.length} archivo${allDocuments.length === 1 ? '' : 's'}`;
}

export function getTotalSize(filteredDocuments: FlatDocument[]): string {
  const total = filteredDocuments.reduce(
    (sum, document) => sum + Number(document.sizeBytes),
    0,
  );
  return formatSize(total);
}

export function getLatestDeliveryTitle(deliveries: DocumentDelivery[]): string {
  return deliveries[0]?.title || 'Sin entregas registradas';
}

export function getLatestDeliveryMeta(deliveries: DocumentDelivery[]): string {
  const latestDelivery = deliveries[0];
  if (!latestDelivery) {
    return 'Cuando existan entregas, aquí verás la más reciente.';
  }

  return `${latestDelivery.category} · ${latestDelivery.relatedPhase} · ${latestDelivery.documents.length} archivo${latestDelivery.documents.length === 1 ? '' : 's'}`;
}

export function getUniqueDeliveryValues(
  deliveries: DocumentDelivery[],
  key: 'category' | 'relatedPhase',
): string[] {
  return Array.from(
    new Set(
      deliveries
        .map((delivery) => delivery[key])
        .filter((value): value is string => Boolean(value)),
    ),
  );
}

export function getTypeLabel(mimeType: string): string {
  if (mimeType?.includes('pdf')) return 'PDF';
  if (mimeType?.includes('image')) return 'Imágenes';
  if (mimeType?.includes('spreadsheet') || mimeType?.includes('excel')) {
    return 'Hojas de cálculo';
  }
  if (mimeType?.includes('word') || mimeType?.includes('document')) {
    return 'Documentos';
  }
  if (mimeType?.includes('zip')) return 'Comprimidos';
  return 'Otros';
}

export function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** index).toFixed(1)} ${units[index]}`;
}
