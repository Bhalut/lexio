import { AppUser } from '../../users/domain/app-user.entity';
import { UserSession } from '../domain/user-session.entity';

export interface AuthenticatedSession {
  session: UserSession;
  user: AppUser;
}

export type AuthMode = 'LOCAL' | 'HYBRID' | 'OIDC_ONLY';

export interface AuthProviderConfig {
  mode: AuthMode;
  oidcEnabled: boolean;
  providerLabel: string;
  localEnabled: boolean;
  passwordResetEnabled: boolean;
}

export interface OidcDiscovery {
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint: string;
  end_session_endpoint?: string;
}

export interface OidcTokenResponse {
  access_token?: string;
  id_token?: string;
}

export interface OidcUserInfo {
  sub?: string;
  email?: string;
  name?: string;
  preferred_username?: string;
}

export interface OidcRuntimeConfig {
  issuerUrl: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string;
}
