import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FlatDocument } from './row.component';

interface TimelineEvent {
  label: string;
  time: string;
  color: string;
}

@Component({
  selector: 'app-document-detail-drawer',
  standalone: true,
  templateUrl: './detail-drawer.component.html',
  styleUrl: './detail-drawer.component.css',
})
export class DocumentDetailDrawerComponent {
  @Input() doc: FlatDocument | null = null;
  @Input() relatedDocs: FlatDocument[] = [];
  @Input() hasPrev = false;
  @Input() hasNext = false;
  @Output() closeDrawer = new EventEmitter<void>();
  @Output() navigate = new EventEmitter<'prev' | 'next'>();
  @Output() selectDoc = new EventEmitter<FlatDocument>();

  get timelineEvents(): TimelineEvent[] {
    if (!this.doc) return [];
    const uploadDate = this.formatDate(this.doc.uploadedAt);
    return [
      {
        label: `Subido por ${this.doc.createdByName}`,
        time: uploadDate,
        color: '#6366f1',
      },
      {
        label: 'Verificado automáticamente',
        time: uploadDate,
        color: '#22c55e',
      },
      {
        label: 'Disponible para el equipo',
        time: uploadDate,
        color: '#3b82f6',
      },
    ];
  }

  getFileColor(mimeType: string): string {
    if (mimeType?.includes('pdf')) return 'red';
    if (mimeType?.includes('image')) return 'green';
    if (mimeType?.includes('spreadsheet') || mimeType?.includes('excel'))
      return 'orange';
    if (mimeType?.includes('word') || mimeType?.includes('document'))
      return 'blue';
    if (mimeType?.includes('zip') || mimeType?.includes('compressed'))
      return 'purple';
    return 'gray';
  }

  getFileTypeLabel(mimeType: string): string {
    if (mimeType?.includes('pdf')) return 'PDF';
    if (mimeType?.includes('image/png')) return 'PNG';
    if (mimeType?.includes('image/jpeg')) return 'JPEG';
    if (mimeType?.includes('image')) return 'IMG';
    if (mimeType?.includes('spreadsheet') || mimeType?.includes('excel'))
      return 'XLSX';
    if (mimeType?.includes('word') || mimeType?.includes('document'))
      return 'DOCX';
    if (mimeType?.includes('zip')) return 'ZIP';
    if (mimeType?.includes('txt')) return 'TXT';
    return 'FILE';
  }

  getHeroIcon(mimeType: string): string {
    const color = this.getIconColor(mimeType);
    if (mimeType?.includes('pdf'))
      return `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.6"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`;
    if (mimeType?.includes('image'))
      return `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.6"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;
    if (mimeType?.includes('spreadsheet') || mimeType?.includes('excel'))
      return `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.6"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/><line x1="12" y1="9" x2="12" y2="21"/></svg>`;
    if (mimeType?.includes('word') || mimeType?.includes('document'))
      return `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.6"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`;
    if (mimeType?.includes('zip'))
      return `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.6"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>`;
    return `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;
  }

  private getIconColor(mimeType: string): string {
    if (mimeType?.includes('pdf')) return '#ef4444';
    if (mimeType?.includes('image')) return '#22c55e';
    if (mimeType?.includes('spreadsheet') || mimeType?.includes('excel'))
      return '#f97316';
    if (mimeType?.includes('word') || mimeType?.includes('document'))
      return '#3b82f6';
    if (mimeType?.includes('zip')) return '#8b5cf6';
    return 'currentColor';
  }

  formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .filter((w) => w.length > 2)
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }
}
