import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { DocumentsPageComponent } from './page.component';
import {
  ApiService,
  CaseHeader,
  CurrentUser,
  DocumentDelivery,
} from '../../shared/services/api.service';
import { AuthStateService } from '../../shared/services/auth-state.service';

describe('DocumentsPageComponent', () => {
  const currentUser$ = new BehaviorSubject<CurrentUser | null>({
    id: 'user-1',
    fullName: 'Carlos Mendoza',
    roleTitle: 'Socio director',
    email: 'carlos@lexio.local',
    authProvider: 'LOCAL',
    roleKey: 'PLATFORM_ADMIN',
    isAdmin: true,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const api = {
    getCaseHeader: vi.fn(),
    getDocumentDeliveries: vi.fn(),
  };
  const authState = {
    currentUser: currentUser$.value,
    currentUser$,
    handleExpiredSession: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    api.getCaseHeader.mockReset();
    api.getDocumentDeliveries.mockReset();
    authState.handleExpiredSession.mockClear();

    await TestBed.configureTestingModule({
      imports: [DocumentsPageComponent],
      providers: [
        { provide: ApiService, useValue: api },
        { provide: AuthStateService, useValue: authState },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'caseId' ? 'case-1' : null),
              },
            },
          },
        },
      ],
    }).compileComponents();
  });

  it('loads the case workspace and flattens delivery documents', async () => {
    api.getCaseHeader.mockReturnValue(
      of({
        id: 'case-1',
        caseNumber: 'LEX-001',
        clientName: 'Cliente Demo',
        status: 'ACTIVE',
        stage: 'Fase probatoria',
        responsibleUserName: 'Carlos Mendoza',
        nextHearingDate: null,
        currentUserAccessLevel: 'OWNER',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as CaseHeader),
    );
    api.getDocumentDeliveries.mockReturnValue(
      of([
        {
          id: 'delivery-1',
          caseId: 'case-1',
          title: 'Entrega principal',
          description: 'Documentos iniciales',
          category: 'Pruebas documentales',
          relatedPhase: 'Fase probatoria',
          createdByName: 'Carlos Mendoza',
          createdAt: new Date().toISOString(),
          documents: [
            {
              id: 'doc-1',
              deliveryId: 'delivery-1',
              originalName: 'evidence.pdf',
              mimeType: 'application/pdf',
              sizeBytes: 1200,
              storageKey: 'storage/doc-1',
              checksum: 'abc123',
              uploadedAt: new Date().toISOString(),
            },
          ],
        } as DocumentDelivery,
      ]),
    );

    const fixture = TestBed.createComponent(DocumentsPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const component = fixture.componentInstance;
    expect(component.loading).toBe(false);
    expect(component.filteredDocuments).toHaveLength(1);
    expect(component.tabs[0].count).toBe(1);
  });

  it('handles expired sessions while loading the workspace', async () => {
    api.getCaseHeader.mockReturnValue(throwError(() => ({ status: 401 })));
    api.getDocumentDeliveries.mockReturnValue(of([]));

    const fixture = TestBed.createComponent(DocumentsPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const component = fixture.componentInstance;
    expect(authState.handleExpiredSession).toHaveBeenCalled();
    expect(component.loading).toBe(false);
    expect(component.error).toContain('Tu sesión expiró');
  });
});
