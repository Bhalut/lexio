import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ApiService,
  CaseAccessLevel,
  CaseParty,
} from '../../../../shared/services/api.service';
import { canManageParties } from '../../../../shared/auth/permissions';
import { AuthStateService } from '../../../../shared/services/auth-state.service';

interface PartyFormState {
  role: string;
  name: string;
  detail: string;
  sortOrder: number;
}

interface CasePartyView extends CaseParty {
  initials: string;
}

@Component({
  selector: 'app-case-parties-panel',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './parties.component.html',
  styleUrl: './parties.component.css',
})
export class CasePartiesPanelComponent implements OnChanges {
  @Input() caseId = '';
  @Input() caseAccessLevel: CaseAccessLevel | null = null;

  parties: CasePartyView[] = [];
  loading = true;
  saving = false;
  error = '';
  formError = '';
  showForm = false;
  editingPartyId: string | null = null;
  draggingPartyId: string | null = null;
  confirmDeleteId: string | null = null;
  form: PartyFormState = this.createEmptyForm();

  private readonly api = inject(ApiService);
  private readonly authState = inject(AuthStateService);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['caseId']?.currentValue) {
      this.loadParties();
    }
  }

  startCreate(): void {
    if (!this.canEditParties()) {
      return;
    }

    this.showForm = true;
    this.editingPartyId = null;
    this.formError = '';
    this.form = this.createEmptyForm();
  }

  startEdit(party: CasePartyView): void {
    if (!this.canEditParties()) {
      return;
    }

    this.showForm = true;
    this.editingPartyId = party.id;
    this.formError = '';
    this.form = {
      role: party.role,
      name: party.name,
      detail: party.detail || '',
      sortOrder: party.sortOrder,
    };
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingPartyId = null;
    this.formError = '';
    this.form = this.createEmptyForm();
  }

  saveParty(): void {
    if (!this.canEditParties() || !this.isFormValid() || this.saving) {
      return;
    }

    this.saving = true;
    this.formError = '';

    const payload = {
      role: this.form.role.trim(),
      name: this.form.name.trim(),
      detail: this.form.detail.trim(),
      sortOrder: Number(this.form.sortOrder) || 0,
    };

    const request = this.editingPartyId
      ? this.api.updateParty(this.caseId, this.editingPartyId, payload)
      : this.api.createParty(this.caseId, payload);

    request.subscribe({
      next: (savedParty) => {
        this.upsertParty(savedParty);
        this.saving = false;
        this.cancelForm();
      },
      error: (err) => {
        if (this.handleUnauthorized(err)) {
          return;
        }

        if (err?.status === 403) {
          this.saving = false;
          this.formError =
            'Tu cuenta no tiene permisos suficientes en este expediente para modificar sus partes.';
          return;
        }

        this.saving = false;
        this.formError =
          err?.error?.message || 'No fue posible guardar la parte del expediente.';
      },
    });
  }

  requestDelete(partyId: string): void {
    this.confirmDeleteId = partyId;
  }

  cancelDelete(): void {
    this.confirmDeleteId = null;
  }

  deleteParty(party: CasePartyView): void {
    if (!this.canEditParties() || this.saving) {
      return;
    }

    this.saving = true;
    this.api.deleteParty(this.caseId, party.id).subscribe({
      next: () => {
        this.parties = this.parties.filter((item) => item.id !== party.id);
        this.saving = false;
        this.confirmDeleteId = null;
      },
      error: (err) => {
        if (this.handleUnauthorized(err)) {
          return;
        }

        if (err?.status === 403) {
          this.saving = false;
          this.formError =
            'Tu cuenta no tiene permisos suficientes en este expediente para modificar sus partes.';
          return;
        }

        this.saving = false;
        this.formError =
          err?.error?.message || 'No fue posible eliminar la parte del expediente.';
      },
    });
  }

  onDragStart(party: CasePartyView): void {
    if (!this.canEditParties() || this.saving) {
      return;
    }

    this.draggingPartyId = party.id;
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onDrop(targetParty: CasePartyView): void {
    if (!this.canEditParties()) {
      return;
    }

    if (!this.draggingPartyId || this.draggingPartyId === targetParty.id) {
      this.draggingPartyId = null;
      return;
    }

    const sourceIndex = this.parties.findIndex(
      (party) => party.id === this.draggingPartyId,
    );
    const targetIndex = this.parties.findIndex((party) => party.id === targetParty.id);

    if (sourceIndex < 0 || targetIndex < 0) {
      this.draggingPartyId = null;
      return;
    }

    const reordered = [...this.parties];
    const [movedParty] = reordered.splice(sourceIndex, 1);
    reordered.splice(targetIndex, 0, movedParty);
    this.parties = reordered.map((party, index) => ({
      ...party,
      sortOrder: (index + 1) * 10,
    }));
    this.draggingPartyId = null;
    this.persistReorder();
  }

  isFormValid(): boolean {
    return (
      this.form.role.trim().length > 0 &&
      this.form.name.trim().length > 0 &&
      Number.isFinite(Number(this.form.sortOrder))
    );
  }

  private loadParties(): void {
    this.loading = true;
    this.error = '';

    this.api.getParties(this.caseId).subscribe({
      next: (parties) => {
        this.parties = this.toView(parties);
        this.loading = false;
      },
      error: (err) => {
        if (this.handleUnauthorized(err)) {
          return;
        }

        this.loading = false;
        this.error =
          err?.status === 403
            ? 'Tu cuenta no está asignada a este expediente o no puede consultar sus partes.'
            : 'No fue posible cargar las partes del expediente.';
      },
    });
  }

  private upsertParty(savedParty: CaseParty): void {
    const remaining = this.parties.filter((party) => party.id !== savedParty.id);
    this.parties = this.toView([...remaining, savedParty]);
  }

  private persistReorder(): void {
    this.saving = true;
    const items = this.parties.map((party) => ({
      id: party.id,
      sortOrder: party.sortOrder,
    }));

    this.api.updatePartyOrder(this.caseId, items).subscribe({
      next: (parties) => {
        this.parties = this.toView(parties);
        this.saving = false;
      },
      error: (err) => {
        if (this.handleUnauthorized(err)) {
          return;
        }

        if (err?.status === 403) {
          this.saving = false;
          this.formError =
            'Tu cuenta no tiene permisos suficientes en este expediente para modificar sus partes.';
          this.loadParties();
          return;
        }

        this.saving = false;
        this.formError =
          err?.error?.message || 'No fue posible reordenar las partes del expediente.';
        this.loadParties();
      },
    });
  }

  private toView(parties: CaseParty[]): CasePartyView[] {
    return [...parties]
      .sort((left, right) => {
        if (left.sortOrder !== right.sortOrder) {
          return left.sortOrder - right.sortOrder;
        }

        return left.name.localeCompare(right.name, 'es');
      })
      .map((party) => ({
        ...party,
        initials: this.getInitials(party.name),
      }));
  }

  private createEmptyForm(): PartyFormState {
    return {
      role: '',
      name: '',
      detail: '',
      sortOrder: this.parties.length === 0 ? 10 : this.parties.length * 10 + 10,
    };
  }

  private getInitials(name?: string | null): string {
    if (!name) return '—';

    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('');
  }

  private handleUnauthorized(error: { status?: number }): boolean {
    if (error?.status !== 401) {
      return false;
    }

    this.saving = false;
    this.showForm = false;
    this.editingPartyId = null;
    this.draggingPartyId = null;
    this.formError = '';
    void this.authState.handleExpiredSession(
      'Tu sesión expiró. Inicia sesión nuevamente para gestionar las partes del expediente.',
    );
    return true;
  }

  canEditParties(): boolean {
    return canManageParties(this.authState.currentUser, this.caseAccessLevel);
  }
}
