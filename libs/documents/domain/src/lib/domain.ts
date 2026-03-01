export interface DocumentMetadata {
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  checksum: string;
}

export interface DocumentDeliveryCreationInput {
  caseId: string;
  title: string;
  description: string;
  category: string;
  relatedPhase: string;
  createdByName: string;
  files: Array<{
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    buffer: Buffer;
  }>;
}

export const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip',
  'application/x-rar-compressed',
  'text/plain',
  'text/csv',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/tiff',
  'image/bmp',
]);

export const MAX_FILE_SIZE = 50 * 1024 * 1024;
export const MAX_FILES_PER_DELIVERY = 20;

export const DOCUMENT_DELIVERY_CATEGORIES = [
  'Poderes y representación',
  'Demanda y contestación',
  'Pruebas documentales',
  'Notificaciones y acuerdos',
  'Facturación y soporte',
  'Correspondencia del caso',
  'Otros antecedentes',
] as const;

export const DOCUMENT_RELATED_PHASES = [
  'Inicio del asunto',
  'Demanda',
  'Contestación',
  'Fase probatoria',
  'Alegatos',
  'Sentencia',
  'Ejecución o cierre',
] as const;

export function isAllowedMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.has(mimeType);
}

export function validateUploadFiles(
  files: Array<{ mimetype: string; originalname: string }>,
): { valid: boolean; invalidFiles: string[] } {
  const invalidFiles = files
    .filter((file) => !isAllowedMimeType(file.mimetype))
    .map((file) => file.originalname);

  return {
    valid: invalidFiles.length === 0,
    invalidFiles,
  };
}
