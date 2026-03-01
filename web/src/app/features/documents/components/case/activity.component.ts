import { Component, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import {
  ApiService,
  CaseActivity,
} from '../../../../shared/services/api.service';
import { AuthStateService } from '../../../../shared/services/auth-state.service';

interface ActivityEvent {
  id: string;
  label: string;
  detail: string;
  time: Date;
  type: 'document' | 'note' | 'status' | 'team' | 'case';
  color: string;
}

type FilterType = 'all' | 'document' | 'note' | 'status' | 'team';

@Component({
  selector: 'app-case-activity-panel',
  standalone: true,
  templateUrl: './activity.component.html',
  styleUrl: './activity.component.css',
})
export class CaseActivityPanelComponent implements OnChanges {
  @Input() caseId = '';
  private readonly api = inject(ApiService);
  private readonly authState = inject(AuthStateService);

  activeFilter: FilterType = 'all';

  filters = [
    { key: 'all' as FilterType, label: 'Todo' },
    { key: 'document' as FilterType, label: 'Documentos' },
    { key: 'note' as FilterType, label: 'Notas' },
    { key: 'status' as FilterType, label: 'Estado' },
    { key: 'team' as FilterType, label: 'Partes' },
  ];

  events: ActivityEvent[] = [];
  loading = true;
  error = '';

  ngOnChanges(changes: SimpleChanges) {
    if (changes['caseId']?.currentValue) {
      this.loadData();
    }
  }

  private loadData() {
    this.loading = true;
    this.api.getActivities(this.caseId).subscribe({
      next: (activities) => {
        this.events = activities.map((act) => this.mapToEvent(act));
        this.loading = false;
      },
      error: (err) => {
        if (err?.status === 401) {
          void this.authState.handleExpiredSession(
            'Tu sesión expiró. Inicia sesión nuevamente para consultar la actividad del expediente.',
          );
          this.error =
            'Tu sesión expiró. Inicia sesión nuevamente para consultar la actividad.';
          this.loading = false;
          return;
        }

        if (err?.status === 403) {
          this.error =
            'Tu cuenta no está asignada a este expediente o no puede consultar la actividad.';
          this.loading = false;
          return;
        }

        this.loading = false;
        this.error = 'No fue posible cargar la actividad del expediente.';
      },
    });
  }

  private mapToEvent(act: CaseActivity): ActivityEvent {
    let type: ActivityEvent['type'] = 'case';
    let color = '#8da9bd'; // Primary 300 (default)
    let label = `<strong>${act.authorName}</strong> `;

    switch (act.type) {
      case 'UPLOAD':
        type = 'document';
        color = '#142a42'; // Ink (Primary)
        label += `subió documentos`;
        break;
      case 'NOTE':
        type = 'note';
        color = '#c8a86f'; // Brass (Accent)
        label += `agregó una nota editorial`;
        break;
      case 'STATUS_CHANGE':
        type = 'status';
        color = '#34526c'; // Primary 500
        label += `cambió el estado del caso`;
        break;
      case 'PARTY_ADDED':
      case 'PARTY_UPDATED':
      case 'PARTY_REMOVED':
        type = 'team';
        color = '#203f59'; // Primary 600
        label +=
          act.type === 'PARTY_ADDED'
            ? 'agregó una parte'
            : act.type === 'PARTY_UPDATED'
              ? 'actualizó una parte'
              : 'eliminó una parte';
        break;
      case 'SYSTEM':
      default:
        type = 'case';
        color = '#8da9bd';
        label += `realizó una acción del sistema`;
        break;
    }

    return {
      id: act.id,
      type,
      color,
      label,
      detail: act.description,
      time: new Date(act.createdAt),
    };
  }

  get filteredEvents(): ActivityEvent[] {
    if (this.activeFilter === 'all') return this.events;
    return this.events.filter((e) => e.type === this.activeFilter);
  }

  getCount(filter: FilterType): number {
    if (filter === 'all') return this.events.length;
    return this.events.filter((e) => e.type === filter).length;
  }

  getRelativeTime(date: Date): string {
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
    const w = Math.floor(diffDays / 7);
    if (w < 4) return `hace ${w} semana${w > 1 ? 's' : ''}`;
    return date.toLocaleDateString('es', { day: 'numeric', month: 'short' });
  }
}
