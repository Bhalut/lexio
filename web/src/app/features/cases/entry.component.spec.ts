import { TestBed } from '@angular/core/testing';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { Router } from '@angular/router';

import { CaseEntryComponent } from './entry.component';
import {
  ApiService,
  CurrentUser,
  CaseSummary,
} from '../../shared/services/api.service';
import { AuthStateService } from '../../shared/services/auth-state.service';

describe('CaseEntryComponent', () => {
  const currentUser$ = new BehaviorSubject<CurrentUser | null>(null);
  const api = {
    getCases: vi.fn(),
  };
  const authState = {
    currentUser: null as CurrentUser | null,
    currentUser$,
    handleExpiredSession: vi.fn().mockResolvedValue(undefined),
  };
  const router = {
    navigate: vi.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    currentUser$.next(null);
    authState.currentUser = null;
    api.getCases.mockReset();
    authState.handleExpiredSession.mockClear();
    router.navigate.mockClear();

    await TestBed.configureTestingModule({
      imports: [CaseEntryComponent],
      providers: [
        { provide: ApiService, useValue: api },
        { provide: AuthStateService, useValue: authState },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();
  });

  it('redirects to the first accessible case', async () => {
    const currentUser = {
      id: 'user-1',
      fullName: 'Dr. Carlos Mendoza',
    } as CurrentUser;
    currentUser$.next(currentUser);
    authState.currentUser = currentUser;
    api.getCases.mockReturnValue(
      of([
        {
          id: 'case-1',
          caseNumber: 'LEX-001',
          clientName: 'Cliente Demo',
        } as CaseSummary,
      ]),
    );

    const fixture = TestBed.createComponent(CaseEntryComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(router.navigate).toHaveBeenCalledWith([
      '/cases',
      'case-1',
      'documents',
    ]);
  });

  it('shows the empty-session state when there are no accessible cases', async () => {
    api.getCases.mockReturnValue(of([]));

    const fixture = TestBed.createComponent(CaseEntryComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const component = fixture.componentInstance;
    expect(component.loading).toBe(false);
    expect(component.title).toBe('Inicia sesión para continuar');
  });

  it('handles expired sessions explicitly', async () => {
    const currentUser = {
      id: 'user-1',
      fullName: 'Dr. Carlos Mendoza',
    } as CurrentUser;
    currentUser$.next(currentUser);
    authState.currentUser = currentUser;
    api.getCases.mockReturnValue(throwError(() => ({ status: 401 })));

    const fixture = TestBed.createComponent(CaseEntryComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const component = fixture.componentInstance;
    expect(authState.handleExpiredSession).toHaveBeenCalled();
    expect(component.loading).toBe(false);
    expect(component.title).toBe('Inicia sesión para continuar');
  });
});
