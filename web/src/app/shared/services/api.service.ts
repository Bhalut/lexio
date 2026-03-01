import {
  HttpClient,
  HttpEventType,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, filter, map } from 'rxjs';

import { ApiUrlService } from './api-url';
import {
  AuditEvent,
  AuthProviderConfig,
  CaseActivity,
  CaseAssignment,
  CaseHeader,
  CaseNote,
  CaseParty,
  CaseSummary,
  CurrentUser,
  DocumentDelivery,
  LoginResponse,
  SessionDeleteResponse,
  UploadProgress,
  UserAdminInput,
} from './api.types';

export * from './api.types';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(ApiUrlService).value;

  getCaseHeader(caseId: string): Observable<CaseHeader> {
    return this.http.get<CaseHeader>(`${this.apiUrl}/cases/${caseId}`);
  }

  getCases(): Observable<CaseSummary[]> {
    return this.http.get<CaseSummary[]>(`${this.apiUrl}/cases`);
  }

  getCurrentUser(): Observable<CurrentUser> {
    return this.http.get<CurrentUser>(`${this.apiUrl}/users/me`);
  }

  getCurrentAuthProviderConfig(): Observable<AuthProviderConfig> {
    return this.http.get<AuthProviderConfig>(
      `${this.apiUrl}/auth/providers/current`,
    );
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/sessions`, {
      email,
      password,
    });
  }

  getOidcAuthorizeUrl(): string {
    return `${this.apiUrl}/auth/oidc/authorize`;
  }

  deleteCurrentSession(): Observable<SessionDeleteResponse> {
    return this.http.delete<SessionDeleteResponse>(
      `${this.apiUrl}/auth/sessions/current`,
    );
  }

  requestPasswordReset(email: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(
      `${this.apiUrl}/auth/password-resets`,
      { email },
    );
  }

  confirmPasswordReset(
    token: string,
    newPassword: string,
  ): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(
      `${this.apiUrl}/auth/password-resets/confirm`,
      { token, newPassword },
    );
  }

  getDocumentDeliveries(caseId: string): Observable<DocumentDelivery[]> {
    return this.http.get<DocumentDelivery[]>(
      `${this.apiUrl}/cases/${caseId}/document-deliveries`,
    );
  }

  createDocumentDelivery(
    caseId: string,
    formData: FormData,
  ): Observable<DocumentDelivery> {
    return this.http.post<DocumentDelivery>(
      `${this.apiUrl}/cases/${caseId}/document-deliveries`,
      formData,
    );
  }

  createDocumentDeliveryWithProgress(
    caseId: string,
    formData: FormData,
  ): Observable<UploadProgress> {
    const request = new HttpRequest(
      'POST',
      `${this.apiUrl}/cases/${caseId}/document-deliveries`,
      formData,
      { reportProgress: true },
    );

    return this.http.request(request).pipe(
      filter(
        (event) =>
          event.type === HttpEventType.UploadProgress ||
          event.type === HttpEventType.Response,
      ),
      map((event) => {
        if (event.type === HttpEventType.UploadProgress) {
          const percent = event.total
            ? Math.round((100 * event.loaded) / event.total)
            : 0;
          return { type: 'progress' as const, percent };
        }

        const response = event as HttpResponse<DocumentDelivery>;
        return {
          type: 'complete' as const,
          percent: 100,
          body: response.body ?? undefined,
        };
      }),
    );
  }

  getNotes(caseId: string): Observable<CaseNote[]> {
    return this.http.get<CaseNote[]>(`${this.apiUrl}/cases/${caseId}/notes`);
  }

  createNote(caseId: string, note: Partial<CaseNote>): Observable<CaseNote> {
    return this.http.post<CaseNote>(`${this.apiUrl}/cases/${caseId}/notes`, note);
  }

  updateNote(
    caseId: string,
    noteId: string,
    updates: Partial<CaseNote>,
  ): Observable<CaseNote> {
    return this.http.patch<CaseNote>(
      `${this.apiUrl}/cases/${caseId}/notes/${noteId}`,
      updates,
    );
  }

  getActivities(caseId: string): Observable<CaseActivity[]> {
    return this.http.get<CaseActivity[]>(
      `${this.apiUrl}/cases/${caseId}/activities`,
    );
  }

  createActivity(
    caseId: string,
    activity: Partial<CaseActivity>,
  ): Observable<CaseActivity> {
    return this.http.post<CaseActivity>(
      `${this.apiUrl}/cases/${caseId}/activities`,
      activity,
    );
  }

  getParties(caseId: string): Observable<CaseParty[]> {
    return this.http.get<CaseParty[]>(`${this.apiUrl}/cases/${caseId}/parties`);
  }

  createParty(
    caseId: string,
    party: Pick<CaseParty, 'role' | 'name'> &
      Partial<Pick<CaseParty, 'detail' | 'sortOrder'>>,
  ): Observable<CaseParty> {
    return this.http.post<CaseParty>(
      `${this.apiUrl}/cases/${caseId}/parties`,
      party,
    );
  }

  updateParty(
    caseId: string,
    partyId: string,
    updates: Partial<Pick<CaseParty, 'role' | 'name' | 'detail' | 'sortOrder'>>,
  ): Observable<CaseParty> {
    return this.http.patch<CaseParty>(
      `${this.apiUrl}/cases/${caseId}/parties/${partyId}`,
      updates,
    );
  }

  deleteParty(
    caseId: string,
    partyId: string,
  ): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(
      `${this.apiUrl}/cases/${caseId}/parties/${partyId}`,
    );
  }

  updatePartyOrder(
    caseId: string,
    items: Array<Pick<CaseParty, 'id' | 'sortOrder'>>,
  ): Observable<CaseParty[]> {
    return this.http.patch<CaseParty[]>(
      `${this.apiUrl}/cases/${caseId}/parties/order`,
      { items },
    );
  }

  getUsers(): Observable<CurrentUser[]> {
    return this.http.get<CurrentUser[]>(`${this.apiUrl}/users`);
  }

  getUserCaseAssignments(userId: string): Observable<CaseAssignment[]> {
    return this.http.get<CaseAssignment[]>(
      `${this.apiUrl}/users/${userId}/case-assignments`,
    );
  }

  getUserCaseAssignmentEvents(userId: string): Observable<AuditEvent[]> {
    return this.http.get<AuditEvent[]>(
      `${this.apiUrl}/users/${userId}/case-assignments/events`,
    );
  }

  upsertUserCaseAssignment(
    userId: string,
    caseId: string,
    accessLevel: CaseAssignment['accessLevel'],
  ): Observable<CaseAssignment> {
    return this.http.put<CaseAssignment>(
      `${this.apiUrl}/users/${userId}/case-assignments/${caseId}`,
      { accessLevel },
    );
  }

  deleteUserCaseAssignment(
    userId: string,
    caseId: string,
  ): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(
      `${this.apiUrl}/users/${userId}/case-assignments/${caseId}`,
    );
  }

  createUser(input: UserAdminInput): Observable<CurrentUser> {
    return this.http.post<CurrentUser>(`${this.apiUrl}/users`, input);
  }

  updateUser(
    userId: string,
    input: Partial<UserAdminInput>,
  ): Observable<CurrentUser> {
    return this.http.patch<CurrentUser>(`${this.apiUrl}/users/${userId}`, input);
  }

  updateUserPassword(
    userId: string,
    newPassword: string,
  ): Observable<CurrentUser> {
    return this.http.put<CurrentUser>(`${this.apiUrl}/users/${userId}/password`, {
      newPassword,
    });
  }
}
