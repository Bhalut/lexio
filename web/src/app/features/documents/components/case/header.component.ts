import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CaseHeader } from '../../../../shared/services/api.service';

@Component({
  selector: 'app-case-header',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class CaseHeaderComponent {
  @Input() caseData: CaseHeader | null = null;

  getStatusLabel(status: string | undefined): string {
    const labels: Record<string, string> = {
      ACTIVE: 'Activo',
      CLOSED: 'Cerrado',
      PENDING: 'En revisión',
      ARCHIVED: 'Archivado',
    };
    return labels[status || ''] || status || 'Sin estado';
  }

  getStatusTone(status: string | undefined): string {
    const tones: Record<string, string> = {
      ACTIVE: 'active',
      CLOSED: 'closed',
      PENDING: 'pending',
      ARCHIVED: 'archived',
    };
    return tones[status || ''] || 'archived';
  }

  formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  getRelativeTime(dateStr: string | null | undefined): string {
    if (!dateStr) return 'sin fecha';

    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'hoy';
    if (diffDays === 1) return 'mañana';
    if (diffDays === -1) return 'ayer';
    if (diffDays > 1 && diffDays < 7) return `en ${diffDays} días`;
    if (diffDays < -1 && diffDays > -7) return `hace ${Math.abs(diffDays)} días`;

    return this.formatDate(dateStr);
  }

  getAccessLabel(accessLevel: string | null | undefined): string {
    const labels: Record<string, string> = {
      OWNER: 'Responsable',
      EDITOR: 'Editor',
      REVIEWER: 'Revisor',
      VIEWER: 'Consulta',
    };
    return labels[accessLevel || ''] || 'Sin acceso';
  }
}
