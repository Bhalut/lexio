import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { forkJoin, map, Observable } from 'rxjs';

import {
  ApiService,
  CaseHeader,
  DocumentDelivery,
  UploadProgress,
} from '../../shared/services/api.service';

export interface DocumentsWorkspaceData {
  caseData: CaseHeader;
  deliveries: DocumentDelivery[];
  documentCount: number;
}

@Injectable({ providedIn: 'root' })
export class DocumentsPageFacade {
  private readonly api = inject(ApiService);

  loadWorkspace(caseId: string): Observable<DocumentsWorkspaceData> {
    return forkJoin({
      caseData: this.api.getCaseHeader(caseId),
      deliveries: this.api.getDocumentDeliveries(caseId),
    }).pipe(
      map(({ caseData, deliveries }) => ({
        caseData,
        deliveries,
        documentCount: deliveries.reduce(
          (sum, delivery) => sum + delivery.documents.length,
          0,
        ),
      })),
    );
  }

  uploadDelivery(
    caseId: string,
    formData: FormData,
  ): Observable<UploadProgress> {
    return this.api.createDocumentDeliveryWithProgress(caseId, formData);
  }
}

export function getLoadErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 403) {
      return 'Tu cuenta no está asignada a este expediente o no tiene el nivel de acceso requerido.';
    }
  }

  return 'No fue posible recuperar el expediente. Verifica la API y vuelve a intentarlo.';
}

export function getUploadErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 403) {
      return 'Tu cuenta no tiene permisos suficientes en este expediente para registrar entregas.';
    }

    const message = error.error?.message;
    if (typeof message === 'string' && message.trim().length > 0) {
      return message;
    }
  }

  return 'No se pudo guardar la entrega. Revisa los archivos e inténtalo nuevamente.';
}
