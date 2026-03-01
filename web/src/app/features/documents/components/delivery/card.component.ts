import { Component, Input } from '@angular/core';
import type { DocumentDelivery } from '../../../../shared/services/api.service';

@Component({
  selector: 'app-delivery-card',
  standalone: true,
  templateUrl: './card.component.html',
  styleUrl: './card.component.css',
})
export class DeliveryCardComponent {
  @Input() delivery!: DocumentDelivery;
  @Input() index = 0;
  @Input() expanded = false;

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  getRelativeTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'hoy';
    if (diffDays === 1) return 'ayer';
    if (diffDays < 7) return `hace ${diffDays} días`;
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `hace ${weeks} sem`;
    }
    const months = Math.floor(diffDays / 30);
    return `hace ${months} mes${months > 1 ? 'es' : ''}`;
  }

  formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  formatTotalSize(documents: DocumentDelivery['documents']): string {
    if (!documents?.length) return '0 B';
    const total = documents.reduce((sum, d) => sum + Number(d.sizeBytes), 0);
    return this.formatSize(total);
  }

  getFileTypeLabel(mimeType: string): string {
    if (mimeType?.includes('pdf')) return 'PDF';
    if (mimeType?.includes('image/png')) return 'PNG';
    if (mimeType?.includes('image/jpeg')) return 'JPEG';
    if (mimeType?.includes('image')) return 'Imagen';
    if (mimeType?.includes('spreadsheet') || mimeType?.includes('excel'))
      return 'Excel';
    if (mimeType?.includes('word') || mimeType?.includes('document'))
      return 'Word';
    if (mimeType?.includes('zip') || mimeType?.includes('compressed'))
      return 'ZIP';
    return mimeType?.split('/')[1]?.toUpperCase() || 'Archivo';
  }

  getFileTypeBadges(): { type: string; count: number; color: string }[] {
    if (!this.delivery?.documents?.length) return [];
    const types = new Map<string, { count: number; color: string }>();
    for (const doc of this.delivery.documents) {
      const type = this.getFileTypeLabel(doc.mimeType);
      const color = this.getFileTypeColor(doc.mimeType);
      const current = types.get(type) || { count: 0, color };
      types.set(type, { count: current.count + 1, color });
    }
    return Array.from(types.entries()).map(([type, data]) => ({
      type,
      count: data.count,
      color: data.color,
    }));
  }

  private getFileTypeColor(mimeType: string): string {
    if (mimeType?.includes('pdf')) return 'red';
    if (mimeType?.includes('image')) return 'green';
    if (mimeType?.includes('spreadsheet') || mimeType?.includes('excel'))
      return 'green';
    if (mimeType?.includes('word') || mimeType?.includes('document'))
      return 'blue';
    if (mimeType?.includes('zip') || mimeType?.includes('compressed'))
      return 'purple';
    return 'gray';
  }

  getFileIcon(mimeType: string): string {
    if (mimeType?.includes('pdf')) {
      return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';
    }
    if (mimeType?.includes('image')) {
      return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>';
    }
    if (mimeType?.includes('spreadsheet') || mimeType?.includes('excel')) {
      return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';
    }
    if (mimeType?.includes('word') || mimeType?.includes('document')) {
      return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';
    }
    return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';
  }
}
