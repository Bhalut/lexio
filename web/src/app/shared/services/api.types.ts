export type CaseAccessLevel = 'OWNER' | 'EDITOR' | 'REVIEWER' | 'VIEWER';

export interface CaseHeader {
  id: string;
  caseNumber: string;
  clientName: string;
  status: string;
  stage: string;
  responsibleUserName: string;
  caseType?: string;
  courtName?: string;
  opposingPartyName?: string;
  nextAction?: string;
  nextHearingDate: string | null;
  currentUserAccessLevel?: CaseAccessLevel | null;
  createdAt: string;
  updatedAt: string;
}

export type CaseSummary = CaseHeader;

export interface DocumentFile {
  id: string;
  deliveryId: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  checksum: string;
  uploadedAt: string;
}

export interface DocumentDelivery {
  id: string;
  caseId: string;
  title: string;
  description: string;
  category: string;
  relatedPhase: string;
  createdByUserId?: string | null;
  createdByName: string;
  documents: DocumentFile[];
  createdAt: string;
}

export interface UploadProgress {
  type: 'progress' | 'complete';
  percent: number;
  body?: DocumentDelivery;
}

export interface CaseNote {
  id: string;
  caseId: string;
  content: string;
  authorName: string;
  authorUserId?: string;
  authorAvatar?: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CaseActivity {
  id: string;
  caseId: string;
  type:
    | 'UPLOAD'
    | 'NOTE'
    | 'STATUS_CHANGE'
    | 'PARTY_ADDED'
    | 'PARTY_UPDATED'
    | 'PARTY_REMOVED'
    | 'SYSTEM';
  description: string;
  metadata?: string;
  authorName: string;
  authorAvatar?: string;
  createdAt: string;
}

export interface CaseParty {
  id: string;
  caseId: string;
  role: string;
  name: string;
  detail?: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CaseAssignment {
  id: string;
  caseId: string;
  userId: string;
  accessLevel: CaseAccessLevel;
  assignedByUserId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuditEvent {
  id: string;
  actionType:
    | 'USER_CREATED'
    | 'USER_UPDATED'
    | 'USER_PASSWORD_RESET'
    | 'CASE_ASSIGNMENT_CREATED'
    | 'CASE_ASSIGNMENT_UPDATED'
    | 'CASE_ASSIGNMENT_REMOVED';
  entityType: 'USER' | 'CASE_ASSIGNMENT';
  entityId: string;
  caseId?: string | null;
  targetUserId?: string | null;
  actorUserId?: string | null;
  actorName?: string | null;
  correlationId?: string | null;
  summary: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface CurrentUser {
  id: string;
  fullName: string;
  roleTitle: string;
  email: string;
  authProvider: 'LOCAL' | 'OIDC';
  roleKey:
    | 'PLATFORM_ADMIN'
    | 'LEGAL_MANAGER'
    | 'LEGAL_OPERATOR'
    | 'LEGAL_REVIEWER'
    | 'LEGAL_VIEWER';
  isAdmin: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SessionResponse {
  success: boolean;
  expiresAt: string;
}

export interface LoginResponse extends SessionResponse {
  user: CurrentUser;
}

export interface AuthProviderConfig {
  mode: 'LOCAL' | 'HYBRID' | 'OIDC_ONLY';
  oidcEnabled: boolean;
  providerLabel: string;
  localEnabled: boolean;
  passwordResetEnabled: boolean;
}

export interface UserAdminInput {
  fullName: string;
  roleTitle: string;
  email: string;
  password?: string;
  authProvider: 'LOCAL' | 'OIDC';
  roleKey:
    | 'PLATFORM_ADMIN'
    | 'LEGAL_MANAGER'
    | 'LEGAL_OPERATOR'
    | 'LEGAL_REVIEWER'
    | 'LEGAL_VIEWER';
  isAdmin: boolean;
  isActive: boolean;
}

export interface SessionDeleteResponse {
  success: boolean;
  redirectUrl?: string | null;
}
