import { AuditEvent, CaseAccessLevel, CaseSummary } from '../services/api.service';
import { UserRoleKey } from '../auth/permissions';

export type AuthProviderOption = 'LOCAL' | 'OIDC';

export interface UserFormState {
  fullName: string;
  roleTitle: string;
  email: string;
  password: string;
  authProvider: AuthProviderOption;
  roleKey: UserRoleKey;
  isAdmin: boolean;
  isActive: boolean;
}

export function createEmptyUserForm(): UserFormState {
  return {
    fullName: '',
    roleTitle: '',
    email: '',
    password: '',
    authProvider: 'LOCAL',
    roleKey: 'LEGAL_OPERATOR',
    isAdmin: false,
    isActive: true,
  };
}

export function getAccessLevelLabel(accessLevel: CaseAccessLevel): string {
  switch (accessLevel) {
    case 'OWNER':
      return 'Responsable';
    case 'EDITOR':
      return 'Editor';
    case 'REVIEWER':
      return 'Revisor';
    case 'VIEWER':
      return 'Consulta';
    default:
      return accessLevel;
  }
}

export function getHistoryCaseLabel(
  event: AuditEvent,
  cases: CaseSummary[],
): string {
  const caseNumber =
    (event.metadata?.['caseNumber'] as string | undefined) ||
    cases.find((caseItem) => caseItem.id === event.caseId)?.caseNumber;
  const clientName =
    (event.metadata?.['clientName'] as string | undefined) ||
    cases.find((caseItem) => caseItem.id === event.caseId)?.clientName;

  if (caseNumber && clientName) {
    return `${caseNumber} · ${clientName}`;
  }

  return caseNumber || clientName || 'Expediente sin metadatos disponibles';
}

export function formatAuditTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleString('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}
