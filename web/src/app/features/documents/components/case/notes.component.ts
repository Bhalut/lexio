import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  Component,
  DestroyRef,
  Input,
  OnChanges,
  SimpleChanges,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ApiService,
  CaseAccessLevel,
  CaseNote,
  CurrentUser,
} from '../../../../shared/services/api.service';
import { canWriteNotes } from '../../../../shared/auth/permissions';
import { AuthStateService } from '../../../../shared/services/auth-state.service';

@Component({
  selector: 'app-case-notes-panel',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './notes.component.html',
  styleUrl: './notes.component.css',
})
export class CaseNotesPanelComponent implements OnChanges {
  @Input() caseId = '';
  @Input() caseAccessLevel: CaseAccessLevel | null = null;
  private readonly api = inject(ApiService);
  private readonly authState = inject(AuthStateService);
  private readonly destroyRef = inject(DestroyRef);

  newNote = '';
  notes: CaseNote[] = [];
  currentUser: CurrentUser | null = null;
  loading = true;
  error = '';

  constructor() {
    this.currentUser = this.authState.currentUser;
    this.authState.currentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (user) => {
          this.currentUser = user;
        },
      });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['caseId']?.currentValue) {
      this.loadData();
    }
  }

  private loadData() {
    this.loading = true;
    this.api.getNotes(this.caseId).subscribe({
      next: (data) => {
        this.notes = data;
        this.loading = false;
      },
      error: (err) => {
        if (err?.status === 401) {
          void this.authState.handleExpiredSession(
            'Tu sesión expiró. Inicia sesión nuevamente para consultar las notas del expediente.',
          );
          this.error =
            'Tu sesión expiró. Inicia sesión nuevamente para consultar las notas.';
          this.loading = false;
          return;
        }

        if (err?.status === 403) {
          this.error =
            'Tu cuenta no está asignada a este expediente o no puede consultar las notas.';
          this.loading = false;
          return;
        }

        this.loading = false;
        this.error = 'Intenta nuevamente cuando la API esté disponible.';
      },
    });
  }

  get sortedNotes(): CaseNote[] {
    return [...this.notes].sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  addNote(): void {
    if (!this.canCreateNotes()) return;

    const content = this.newNote.trim();
    if (!content || content.length > 500) return;

    this.api
      .createNote(this.caseId, {
        content,
        isPinned: false,
      })
      .subscribe({
        next: (newNote) => {
          this.notes = [newNote, ...this.notes];
          this.newNote = '';
        },
        error: (err) => {
          if (err?.status === 401) {
            void this.authState.handleExpiredSession(
              'Tu sesión expiró. Inicia sesión nuevamente para registrar notas.',
            );
            return;
          }

          if (err?.status === 403) {
            this.error =
              'Tu cuenta no tiene permisos suficientes en este expediente para registrar notas.';
          }
        },
      });
  }

  togglePin(note: CaseNote): void {
    if (!this.canCreateNotes()) {
      return;
    }

    const originalPinned = note.isPinned;
    // Optimistic update
    note.isPinned = !note.isPinned;
    this.notes = [...this.notes]; // Trigger change detection

    this.api
      .updateNote(this.caseId, note.id, { isPinned: note.isPinned })
      .subscribe({
        error: (err) => {
          // Revert on error
          note.isPinned = originalPinned;
          this.notes = [...this.notes];

          if (err?.status === 401) {
            void this.authState.handleExpiredSession(
              'Tu sesión expiró. Inicia sesión nuevamente para actualizar notas.',
            );
          }
        },
      });
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .filter((w) => w.length > 2)
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  getRelativeTime(dateString: string | Date): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'ahora';
    if (diffMins < 60) return `hace ${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `hace ${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'ayer';
    if (diffDays < 7) return `hace ${diffDays} días`;
    return date.toLocaleDateString('es', { day: 'numeric', month: 'short' });
  }

  canCreateNotes(): boolean {
    return canWriteNotes(this.currentUser, this.caseAccessLevel);
  }
}
