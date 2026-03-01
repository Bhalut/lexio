import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-upload-modal',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.css',
})
export class UploadModalComponent {
  @Input() uploadProgress = 0;
  @Input() uploading = false;
  @Input() uploadError = '';

  @Output() closeModal = new EventEmitter<void>();
  @Output() upload = new EventEmitter<FormData>();
  @Output() cancelUpload = new EventEmitter<void>();

  title = '';
  description = '';
  category = 'Pruebas documentales';
  relatedPhase = 'Fase probatoria';
  selectedFiles: File[] = [];
  isDragOver = false;

  private readonly maxFiles = 20;
  private readonly maxFileSize = 50 * 1024 * 1024;
  readonly categories = [
    'Poderes y representación',
    'Demanda y contestación',
    'Pruebas documentales',
    'Notificaciones y acuerdos',
    'Facturación y soporte',
    'Correspondencia del caso',
    'Otros antecedentes',
  ];
  readonly phases = [
    'Inicio del asunto',
    'Demanda',
    'Contestación',
    'Fase probatoria',
    'Alegatos',
    'Sentencia',
    'Ejecución o cierre',
  ];

  requestClose(): void {
    if (!this.uploading) {
      this.closeModal.emit();
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (!this.uploading) {
      this.isDragOver = true;
    }
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;

    if (this.uploading) return;

    const files = event.dataTransfer?.files;
    if (files) {
      this.addFiles(Array.from(files));
    }
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.addFiles(Array.from(input.files));
      input.value = '';
    }
  }

  addFiles(newFiles: File[]): void {
    const existing = new Set(this.selectedFiles.map((file) => this.trackFile(file)));
    const incoming = new Set<string>();
    const unique = newFiles.filter((file) => {
      const fileKey = this.trackFile(file);
      if (existing.has(fileKey) || incoming.has(fileKey)) {
        return false;
      }

      incoming.add(fileKey);
      return true;
    });
    this.selectedFiles = [...this.selectedFiles, ...unique].slice(0, this.maxFiles);
  }

  clearFiles(): void {
    this.selectedFiles = [];
  }

  removeFile(file: File): void {
    this.selectedFiles = this.selectedFiles.filter((item) => item !== file);
  }

  trackFile(file: File): string {
    return `${file.name}-${file.size}-${file.lastModified}`;
  }

  getFileError(file: File): string {
    if (file.size > this.maxFileSize) {
      return 'supera 50 MB';
    }

    return '';
  }

  isValid(): boolean {
    return (
      this.title.trim().length > 0 &&
      this.description.trim().length > 0 &&
      this.selectedFiles.length > 0 &&
      this.selectedFiles.every((file) => !this.getFileError(file))
    );
  }

  submit(): void {
    if (!this.isValid() || this.uploading) return;

    const formData = new FormData();
    formData.append('title', this.title.trim());
    formData.append('description', this.description.trim());
    formData.append('category', this.category);
    formData.append('relatedPhase', this.relatedPhase);

    for (const file of this.selectedFiles) {
      formData.append('files', file);
    }

    this.upload.emit(formData);
  }

  getTotalSize(): string {
    const total = this.selectedFiles.reduce((sum, file) => sum + file.size, 0);
    return this.formatSize(total);
  }

  getFileTypeLabel(file: File): string {
    const type = file.type || '';
    if (type.includes('pdf')) return 'PDF';
    if (type.includes('image')) return 'Imagen';
    if (type.includes('spreadsheet') || type.includes('excel')) return 'Excel';
    if (type.includes('word') || type.includes('document')) return 'Word';
    if (type.includes('zip') || type.includes('compressed')) return 'Comprimido';

    const extension = file.name.split('.').pop()?.toUpperCase();
    return extension || 'Archivo';
  }

  formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';

    const units = ['B', 'KB', 'MB', 'GB'];
    const index = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / 1024 ** index).toFixed(1)} ${units[index]}`;
  }
}
