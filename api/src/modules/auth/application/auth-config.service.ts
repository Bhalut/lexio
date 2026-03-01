import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CookieOptions } from 'express';

import {
  AuthMode,
  AuthProviderConfig,
  OidcRuntimeConfig,
} from './auth.types';

@Injectable()
export class AuthConfigService {
  constructor(private readonly config: ConfigService) {}

  getProviderConfig(): AuthProviderConfig {
    const providerLabel =
      this.config.get<string>('auth.providerLabel') || 'SSO del despacho';
    const oidcEnabled = this.hasOidcConfig();
    const requestedMode = (this.config.get<string>('auth.mode') || 'LOCAL').toUpperCase();
    const mode: AuthMode =
      requestedMode === 'OIDC_ONLY'
        ? oidcEnabled
          ? 'OIDC_ONLY'
          : 'LOCAL'
        : requestedMode === 'HYBRID'
          ? oidcEnabled
            ? 'HYBRID'
            : 'LOCAL'
          : 'LOCAL';

    return {
      mode,
      oidcEnabled,
      providerLabel,
      localEnabled: mode !== 'OIDC_ONLY',
      passwordResetEnabled: mode !== 'OIDC_ONLY',
    };
  }

  isLocalAuthEnabled(): boolean {
    return this.getProviderConfig().mode !== 'OIDC_ONLY';
  }

  hasOidcConfig(): boolean {
    return Boolean(
      this.config.get<string>('auth.oidcIssuerUrl') &&
        this.config.get<string>('auth.oidcClientId') &&
        this.config.get<string>('auth.oidcClientSecret') &&
        this.config.get<string>('auth.oidcRedirectUri'),
    );
  }

  getSessionCookieName(): string {
    return this.config.get<string>('auth.sessionCookieName') || 'lexio_session';
  }

  getOidcStateCookieName(): string {
    return this.config.get<string>('auth.oidcStateCookieName') || 'lexio_oidc_state';
  }

  getSessionCookieOptions(expiresAt: Date): CookieOptions {
    return {
      httpOnly: true,
      sameSite: this.getCookieSameSite(),
      secure: this.config.get<boolean>('auth.cookieSecure') || false,
      domain: this.config.get<string>('auth.cookieDomain') || undefined,
      path: this.config.get<string>('auth.cookiePath') || '/',
      expires: expiresAt,
    };
  }

  getTransientCookieOptions(maxAge: number): CookieOptions {
    return {
      httpOnly: true,
      sameSite: this.getCookieSameSite(),
      secure: this.config.get<boolean>('auth.cookieSecure') || false,
      domain: this.config.get<string>('auth.cookieDomain') || undefined,
      path: this.config.get<string>('auth.cookiePath') || '/',
      maxAge,
    };
  }

  getClearedCookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      sameSite: this.getCookieSameSite(),
      secure: this.config.get<boolean>('auth.cookieSecure') || false,
      domain: this.config.get<string>('auth.cookieDomain') || undefined,
      path: this.config.get<string>('auth.cookiePath') || '/',
    };
  }

  getSsoRedirectUrl(): string {
    return this.config.get<string>('auth.postLoginUrl') || 'http://localhost:4200/';
  }

  getSessionTtlHours(): number {
    return Number(this.config.get<number>('auth.sessionTtlHours') || 24 * 7);
  }

  getPasswordResetTokenTtlMinutes(): number {
    return Number(this.config.get<number>('auth.passwordResetTokenTtlMinutes') || 30);
  }

  buildPasswordResetUrl(token: string, email: string): string {
    const template =
      this.config.get<string>('auth.passwordResetUrlTemplate') ||
      'http://localhost:4200/?resetToken={token}';

    return template
      .replace('{token}', encodeURIComponent(token))
      .replace('{email}', encodeURIComponent(email));
  }

  getRequiredOidcConfig(): OidcRuntimeConfig {
    const issuerUrl = this.config.get<string>('auth.oidcIssuerUrl');
    const clientId = this.config.get<string>('auth.oidcClientId');
    const clientSecret = this.config.get<string>('auth.oidcClientSecret');
    const redirectUri = this.config.get<string>('auth.oidcRedirectUri');

    if (!issuerUrl || !clientId || !clientSecret || !redirectUri) {
      throw new NotFoundException('OIDC login is not configured.');
    }

    return {
      issuerUrl,
      clientId,
      clientSecret,
      redirectUri,
      scope: this.config.get<string>('auth.oidcScope') || 'openid profile email',
    };
  }

  getOidcAllowedDomains(): string[] {
    return this.config.get<string[]>('auth.oidcAllowedDomains') || [];
  }

  getPostLogoutUrl(): string | null {
    return (
      this.config.get<string>('auth.postLogoutUrl') ||
      this.config.get<string>('auth.postLoginUrl') ||
      null
    );
  }

  private getCookieSameSite(): CookieOptions['sameSite'] {
    const sameSite = (this.config.get<string>('auth.cookieSameSite') || 'lax').toLowerCase();
    if (sameSite === 'none' || sameSite === 'strict') {
      return sameSite;
    }

    return 'lax';
  }
}
