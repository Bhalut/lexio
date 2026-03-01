import { Component, EventEmitter, Input, Output } from '@angular/core';
import type { FlatDocument } from './row.component';

@Component({
  selector: 'app-document-grid-card',
  standalone: true,
  templateUrl: './grid-card.component.html',
  styleUrl: './grid-card.component.css',
})
export class DocumentGridCardComponent {
  @Input() doc!: FlatDocument;
  @Input() index = 0;
  @Output() selectDoc = new EventEmitter<FlatDocument>();

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

  getFileIcon(mimeType: string): string {
    const color = this.getIconColor(mimeType);
    if (mimeType?.includes('pdf'))
      return `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`;
    if (mimeType?.includes('image'))
      return `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`;
    if (mimeType?.includes('spreadsheet') || mimeType?.includes('excel'))
      return `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/><line x1="12" y1="9" x2="12" y2="21"/></svg>`;
    if (mimeType?.includes('word') || mimeType?.includes('document'))
      return `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`;
    if (mimeType?.includes('zip'))
      return `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>`;
    return `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;
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

  getRelativeTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'hoy';
    if (diffDays === 1) return 'ayer';
    if (diffDays < 7) return `hace ${diffDays} días`;
    if (diffDays < 30) {
      const w = Math.floor(diffDays / 7);
      return `hace ${w} sem`;
    }
    const m = Math.floor(diffDays / 30);
    return `hace ${m} mes${m > 1 ? 'es' : ''}`;
  }

  formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}
