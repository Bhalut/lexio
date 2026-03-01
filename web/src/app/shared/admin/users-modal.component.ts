import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, OnInit, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import {
  AuditEvent,
  CaseAccessLevel,
  CaseAssignment,
  CaseSummary,
  CurrentUser,
  UserAdminInput,
} from '../services/api.service';
import { AuthStateService } from '../services/auth-state.service';
import { roleLabel, UserRoleKey } from '../auth/permissions';
import {
  UserFormState,
  createEmptyUserForm,
  formatAuditTimestamp,
  getAccessLevelLabel,
  getHistoryCaseLabel,
} from './users-modal.presenter';
import { UserAdminFacade } from './users-modal.facade';

@Component({
  selector: 'app-user-admin-modal',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './users-modal.component.html',
  styleUrl: './users-modal.component.css',
})
export class UserAdminModalComponent implements OnInit {
  @Output() closeRequested = new EventEmitter<void>();

  users: CurrentUser[] = [];
  cases: CaseSummary[] = [];
  assignments: CaseAssignment[] = [];
  assignmentHistory: AuditEvent[] = [];
  loading = true;
  assignmentsLoading = false;
  assignmentHistoryLoading = false;
  saving = false;
  assignmentSavingCaseId: string | null = null;
  error = '';
  successMessage = '';
  selectedUserId: string | null = null;
  resetPassword = '';
  form: UserFormState = createEmptyUserForm();
  private readonly assignmentDrafts = new Map<string, CaseAccessLevel>();

  private readonly authState = inject(AuthStateService);
  private readonly facade = inject(UserAdminFacade);

  ngOnInit(): void {
    void this.loadInitialData();
  }

  async selectUser(user: CurrentUser): Promise<void> {
    this.selectedUserId = user.id;
    this.form = {
      fullName: user.fullName,
      roleTitle: user.roleTitle,
      email: user.email,
      password: '',
      authProvider: user.authProvider,
      roleKey: user.roleKey,
      isAdmin: user.isAdmin,
      isActive: user.isActive,
    };
    this.resetPassword = '';
    this.successMessage = '';
    this.error = '';
    this.assignments = [];
    this.assignmentHistory = [];
    this.assignmentDrafts.clear();
    await this.loadUserDetails(user.id);
  }

  startCreate(): void {
    this.selectedUserId = null;
    this.form = createEmptyUserForm();
    this.resetPassword = '';
    this.successMessage = '';
    this.error = '';
    this.assignments = [];
    this.assignmentHistory = [];
    this.assignmentDrafts.clear();
  }

  resetEditor(): void {
    if (!this.selectedUserId) {
      this.startCreate();
      return;
    }

    const current = this.users.find((user) => user.id === this.selectedUserId);
    if (current) {
      void this.selectUser(current);
    }
  }

  isFormValid(): boolean {
    if (
      !this.form.fullName.trim() ||
      !this.form.roleTitle.trim() ||
      !this.form.email.trim()
    ) {
      return false;
    }

    if (!this.selectedUserId && this.form.authProvider === 'LOCAL') {
      return this.form.password.trim().length >= 8;
    }

    return true;
  }

  async saveUser(): Promise<void> {
    if (!this.isFormValid() || this.saving) {
      return;
    }

    this.saving = true;
    this.error = '';
    this.successMessage = '';

    const payload: UserAdminInput = {
      fullName: this.form.fullName.trim(),
      roleTitle: this.form.roleTitle.trim(),
      email: this.form.email.trim(),
      authProvider: this.form.authProvider,
      roleKey: this.form.roleKey,
      isAdmin: this.form.roleKey === 'PLATFORM_ADMIN',
      isActive: this.form.isActive,
      password:
        !this.selectedUserId && this.form.authProvider === 'LOCAL'
          ? this.form.password
          : undefined,
    };

    try {
      const user = await firstValueFrom(
        this.facade.saveUser(this.selectedUserId, payload),
      );
      this.successMessage = this.selectedUserId
        ? 'Usuario actualizado correctamente.'
        : 'Usuario creado correctamente.';
      this.selectedUserId = user.id;
      await this.loadInitialData(user.id);
    } catch (error) {
      if (await this.handleUnauthorized(error)) {
        return;
      }

      this.error =
        this.getErrorMessage(error) || 'No fue posible guardar el usuario.';
    } finally {
      this.saving = false;
    }
  }

  async updateUserPassword(): Promise<void> {
    if (!this.selectedUserId || this.resetPassword.trim().length < 8 || this.saving) {
      return;
    }

    this.saving = true;
    this.error = '';
    this.successMessage = '';

    try {
      const user = await firstValueFrom(
        this.facade.updateUserPassword(this.selectedUserId, this.resetPassword),
      );
      this.successMessage = `Contraseña restablecida para ${user.fullName}.`;
      this.resetPassword = '';
      await this.loadInitialData(user.id);
    } catch (error) {
      if (await this.handleUnauthorized(error)) {
        return;
      }

      this.error =
        this.getErrorMessage(error) ||
        'No fue posible restablecer la contraseña.';
    } finally {
      this.saving = false;
    }
  }

  getRoleLabel(roleKey: UserRoleKey): string {
    return roleLabel(roleKey);
  }

  getAccessLevelLabel(accessLevel: CaseAccessLevel): string {
    return getAccessLevelLabel(accessLevel);
  }

  getHistoryCaseLabel(event: AuditEvent): string {
    return getHistoryCaseLabel(event, this.cases);
  }

  formatAuditTimestamp(timestamp: string): string {
    return formatAuditTimestamp(timestamp);
  }

  getDraftAssignmentLevel(caseId: string): CaseAccessLevel {
    return (
      this.assignmentDrafts.get(caseId) ||
      this.assignments.find((assignment) => assignment.caseId === caseId)
        ?.accessLevel ||
      'VIEWER'
    );
  }

  setDraftAssignmentLevel(caseId: string, accessLevel: CaseAccessLevel): void {
    this.assignmentDrafts.set(caseId, accessLevel);
  }

  hasAssignment(caseId: string): boolean {
    return this.assignments.some((assignment) => assignment.caseId === caseId);
  }

  async saveCaseAssignment(caseId: string): Promise<void> {
    if (!this.selectedUserId || this.saving || this.assignmentSavingCaseId) {
      return;
    }

    this.assignmentSavingCaseId = caseId;
    this.error = '';
    this.successMessage = '';

    try {
      const assignment = await firstValueFrom(
        this.facade.saveCaseAssignment(
          this.selectedUserId,
          caseId,
          this.getDraftAssignmentLevel(caseId),
        ),
      );
      this.assignments = [
        ...this.assignments.filter((item) => item.caseId !== caseId),
        assignment,
      ];
      this.assignmentDrafts.set(caseId, assignment.accessLevel);
      this.successMessage = 'Asignación de expediente actualizada.';
      this.assignmentSavingCaseId = null;
      await this.reloadAssignmentHistory();
    } catch (error) {
      if (await this.handleUnauthorized(error)) {
        return;
      }

      this.error =
        this.getErrorMessage(error) ||
        'No fue posible actualizar la asignación del expediente.';
    } finally {
      this.assignmentSavingCaseId = null;
    }
  }

  async removeCaseAssignment(caseId: string): Promise<void> {
    if (
      !this.selectedUserId ||
      this.saving ||
      this.assignmentSavingCaseId ||
      !this.hasAssignment(caseId)
    ) {
      return;
    }

    this.assignmentSavingCaseId = caseId;
    this.error = '';
    this.successMessage = '';

    try {
      await firstValueFrom(
        this.facade.removeCaseAssignment(this.selectedUserId, caseId),
      );
      this.assignments = this.assignments.filter(
        (assignment) => assignment.caseId !== caseId,
      );
      this.assignmentDrafts.set(caseId, 'VIEWER');
      this.successMessage = 'Asignación de expediente removida.';
      this.assignmentSavingCaseId = null;
      await this.reloadAssignmentHistory();
    } catch (error) {
      if (await this.handleUnauthorized(error)) {
        return;
      }

      this.error =
        this.getErrorMessage(error) ||
        'No fue posible remover la asignación del expediente.';
    } finally {
      this.assignmentSavingCaseId = null;
    }
  }

  private async loadInitialData(selectUserId?: string): Promise<void> {
    this.loading = true;
    this.error = '';

    try {
      const { users, cases } = await firstValueFrom(this.facade.loadInitialData());
      this.users = users;
      this.cases = cases;
      this.loading = false;
      const targetUserId =
        selectUserId || this.selectedUserId || users[0]?.id || null;

      if (targetUserId) {
        const targetUser = users.find((user) => user.id === targetUserId);
        if (targetUser) {
          await this.selectUser(targetUser);
        }
      }
    } catch (error) {
      if (await this.handleUnauthorized(error)) {
        return;
      }

      this.error = 'No fue posible cargar la administración de usuarios.';
    } finally {
      this.loading = false;
    }
  }

  private async loadUserDetails(userId: string): Promise<void> {
    this.assignmentsLoading = true;
    this.assignmentHistoryLoading = true;

    try {
      const { assignments, assignmentHistory } = await firstValueFrom(
        this.facade.loadUserDetails(userId),
      );
      this.assignments = assignments;
      this.assignmentHistory = assignmentHistory;
      this.assignmentDrafts.clear();
      for (const assignment of assignments) {
        this.assignmentDrafts.set(assignment.caseId, assignment.accessLevel);
      }
    } catch (error) {
      if (await this.handleUnauthorized(error)) {
        return;
      }

      this.error =
        this.getErrorMessage(error) ||
        'No fue posible cargar las asignaciones del usuario.';
    } finally {
      this.assignmentsLoading = false;
      this.assignmentHistoryLoading = false;
    }
  }

  private async reloadAssignmentHistory(): Promise<void> {
    if (!this.selectedUserId) {
      return;
    }

    this.assignmentHistoryLoading = true;
    try {
      this.assignmentHistory = await firstValueFrom(
        this.facade.loadAssignmentHistory(this.selectedUserId),
      );
    } catch (error) {
      if (await this.handleUnauthorized(error)) {
        return;
      }

      this.error =
        this.getErrorMessage(error) ||
        'No fue posible cargar el historial de asignaciones.';
    } finally {
      this.assignmentHistoryLoading = false;
    }
  }

  private getErrorMessage(error: unknown): string | null {
    if (error instanceof HttpErrorResponse) {
      const message = error.error?.message;
      return typeof message === 'string' ? message : null;
    }

    return null;
  }

  private async handleUnauthorized(error: unknown): Promise<boolean> {
    if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
      return false;
    }

    this.loading = false;
    this.assignmentsLoading = false;
    this.assignmentHistoryLoading = false;
    this.saving = false;
    this.assignmentSavingCaseId = null;
    await this.authState.handleExpiredSession(
      'Tu sesión expiró. Inicia sesión nuevamente para administrar usuarios.',
    );
    this.closeRequested.emit();
    return true;
  }
}
