import { Injectable, inject } from '@angular/core';
import { forkJoin, Observable } from 'rxjs';

import {
  ApiService,
  AuditEvent,
  CaseAccessLevel,
  CaseAssignment,
  CaseSummary,
  CurrentUser,
  UserAdminInput,
} from '../services/api.service';

export interface UserAdminInitialData {
  users: CurrentUser[];
  cases: CaseSummary[];
}

export interface UserAdminDetailsData {
  assignments: CaseAssignment[];
  assignmentHistory: AuditEvent[];
}

@Injectable({ providedIn: 'root' })
export class UserAdminFacade {
  private readonly api = inject(ApiService);

  loadInitialData(): Observable<UserAdminInitialData> {
    return forkJoin({
      users: this.api.getUsers(),
      cases: this.api.getCases(),
    });
  }

  loadUserDetails(userId: string): Observable<UserAdminDetailsData> {
    return forkJoin({
      assignments: this.api.getUserCaseAssignments(userId),
      assignmentHistory: this.api.getUserCaseAssignmentEvents(userId),
    });
  }

  loadAssignmentHistory(userId: string): Observable<AuditEvent[]> {
    return this.api.getUserCaseAssignmentEvents(userId);
  }

  saveUser(
    userId: string | null,
    payload: UserAdminInput,
  ): Observable<CurrentUser> {
    if (userId) {
      return this.api.updateUser(userId, payload);
    }

    return this.api.createUser(payload);
  }

  updateUserPassword(
    userId: string,
    newPassword: string,
  ): Observable<CurrentUser> {
    return this.api.updateUserPassword(userId, newPassword);
  }

  saveCaseAssignment(
    userId: string,
    caseId: string,
    accessLevel: CaseAccessLevel,
  ): Observable<CaseAssignment> {
    return this.api.upsertUserCaseAssignment(userId, caseId, accessLevel);
  }

  removeCaseAssignment(
    userId: string,
    caseId: string,
  ): Observable<{ success: boolean }> {
    return this.api.deleteUserCaseAssignment(userId, caseId);
  }
}
