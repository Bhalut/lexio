import { CaseAccessLevel, CurrentUser } from '../services/api.service';

export type UserRoleKey =
  | 'PLATFORM_ADMIN'
  | 'LEGAL_MANAGER'
  | 'LEGAL_OPERATOR'
  | 'LEGAL_REVIEWER'
  | 'LEGAL_VIEWER';

const documentWriterRoles = new Set<UserRoleKey>([
  'PLATFORM_ADMIN',
  'LEGAL_MANAGER',
  'LEGAL_OPERATOR',
]);

const notesWriterRoles = new Set<UserRoleKey>([
  'PLATFORM_ADMIN',
  'LEGAL_MANAGER',
  'LEGAL_OPERATOR',
  'LEGAL_REVIEWER',
]);

const documentCaseAccessLevels = new Set<CaseAccessLevel>(['OWNER', 'EDITOR']);
const notesCaseAccessLevels = new Set<CaseAccessLevel>([
  'OWNER',
  'EDITOR',
  'REVIEWER',
]);

function hasCaseAccess(
  caseAccessLevel: CaseAccessLevel | null | undefined,
  allowedLevels: Set<CaseAccessLevel>,
): boolean {
  return Boolean(caseAccessLevel && allowedLevels.has(caseAccessLevel));
}

export function canManageUsers(user: CurrentUser | null | undefined): boolean {
  return user?.roleKey === 'PLATFORM_ADMIN';
}

export function canUploadDocuments(
  user: CurrentUser | null | undefined,
  caseAccessLevel: CaseAccessLevel | null | undefined,
): boolean {
  return Boolean(
    user &&
      documentWriterRoles.has(user.roleKey) &&
      hasCaseAccess(caseAccessLevel, documentCaseAccessLevels),
  );
}

export function canManageParties(
  user: CurrentUser | null | undefined,
  caseAccessLevel: CaseAccessLevel | null | undefined,
): boolean {
  return Boolean(
    user &&
      documentWriterRoles.has(user.roleKey) &&
      hasCaseAccess(caseAccessLevel, documentCaseAccessLevels),
  );
}

export function canWriteNotes(
  user: CurrentUser | null | undefined,
  caseAccessLevel: CaseAccessLevel | null | undefined,
): boolean {
  return Boolean(
    user &&
      notesWriterRoles.has(user.roleKey) &&
      hasCaseAccess(caseAccessLevel, notesCaseAccessLevels),
  );
}

export function roleLabel(roleKey: UserRoleKey): string {
  switch (roleKey) {
    case 'PLATFORM_ADMIN':
      return 'Administrador de plataforma';
    case 'LEGAL_MANAGER':
      return 'Responsable legal';
    case 'LEGAL_OPERATOR':
      return 'Operador legal';
    case 'LEGAL_REVIEWER':
      return 'Revisor legal';
    case 'LEGAL_VIEWER':
      return 'Consulta';
    default:
      return roleKey;
  }
}
