import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';

import {
  AppUser,
  AppUserRole,
  AuthProviderType,
} from '../../users/domain/app-user.entity';
import { UserSession } from '../domain/user-session.entity';
import { hashPassword } from './password-hash';
import { AuthConfigService } from './auth-config.service';
import {
  OidcDiscovery,
  OidcTokenResponse,
  OidcUserInfo,
} from './auth.types';

@Injectable()
export class AuthOidcService {
  constructor(
    @InjectRepository(AppUser)
    private readonly userRepository: Repository<AppUser>,
    private readonly authConfig: AuthConfigService,
  ) {}

  async startAuthorization(): Promise<{ authorizationUrl: string; state: string }> {
    const oidcConfig = this.authConfig.getRequiredOidcConfig();
    const discovery = await this.fetchDiscovery();
    const state = randomUUID();
    const params = new URLSearchParams({
      client_id: oidcConfig.clientId,
      redirect_uri: oidcConfig.redirectUri,
      response_type: 'code',
      scope: oidcConfig.scope,
      state,
    });

    return {
      authorizationUrl: `${discovery.authorization_endpoint}?${params.toString()}`,
      state,
    };
  }

  async exchangeAuthorizationCode(
    code: string,
    state: string,
    expectedState?: string | null,
  ): Promise<{ user: AppUser; idToken: string | null }> {
    const oidcConfig = this.authConfig.getRequiredOidcConfig();
    if (!expectedState || expectedState !== state) {
      throw new BadRequestException('Invalid SSO state.');
    }

    const discovery = await this.fetchDiscovery();
    const tokenResponse = await this.fetchJson<OidcTokenResponse>(
      discovery.token_endpoint,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: oidcConfig.redirectUri,
          client_id: oidcConfig.clientId,
          client_secret: oidcConfig.clientSecret,
        }),
      },
    );

    if (!tokenResponse.access_token) {
      throw new BadGatewayException(
        'OIDC token exchange did not return an access token.',
      );
    }

    const userInfo = await this.fetchJson<OidcUserInfo>(
      discovery.userinfo_endpoint,
      {
        headers: {
          Authorization: `Bearer ${tokenResponse.access_token}`,
        },
      },
    );

    const user = await this.findOrProvisionOidcUser(
      userInfo,
      oidcConfig.issuerUrl,
    );
    return {
      user,
      idToken: tokenResponse.id_token || null,
    };
  }

  async buildLogoutRedirectUrl(session: UserSession): Promise<string | null> {
    if (
      session.user.authProvider !== AuthProviderType.OIDC ||
      !this.authConfig.hasOidcConfig()
    ) {
      return null;
    }

    const postLogoutUrl = this.authConfig.getPostLogoutUrl();

    try {
      const discovery = await this.fetchDiscovery();
      if (!discovery.end_session_endpoint) {
        return postLogoutUrl;
      }

      const params = new URLSearchParams();
      if (postLogoutUrl) {
        params.set('post_logout_redirect_uri', postLogoutUrl);
      }

      const clientId = this.authConfig.getRequiredOidcConfig().clientId;
      if (clientId) {
        params.set('client_id', clientId);
      }
      if (session.idToken) {
        params.set('id_token_hint', session.idToken);
      }

      const suffix = params.toString();
      return suffix
        ? `${discovery.end_session_endpoint}?${suffix}`
        : discovery.end_session_endpoint;
    } catch {
      return postLogoutUrl;
    }
  }

  private async fetchDiscovery(): Promise<OidcDiscovery> {
    const oidcConfig = this.authConfig.getRequiredOidcConfig();
    return this.fetchJson<OidcDiscovery>(
      `${oidcConfig.issuerUrl.replace(/\/$/, '')}/.well-known/openid-configuration`,
    );
  }

  private async fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
    const response = await fetch(url, init);
    if (!response.ok) {
      throw new BadGatewayException(
        `SSO provider request failed (${response.status}).`,
      );
    }

    return (await response.json()) as T;
  }

  private async findOrProvisionOidcUser(
    userInfo: OidcUserInfo,
    issuerUrl: string,
  ): Promise<AppUser> {
    const email = userInfo.email?.trim().toLowerCase();
    if (!email) {
      throw new UnauthorizedException('The SSO provider did not return an email.');
    }

    this.assertAllowedOidcEmail(email);

    let existing: AppUser | null = null;
    if (userInfo.sub?.trim()) {
      existing = await this.userRepository.findOne({
        where: {
          externalSubject: userInfo.sub.trim(),
          externalIssuer: issuerUrl,
        },
      });
    }

    if (!existing) {
      existing = await this.userRepository.findOne({ where: { email } });
    }

    if (existing) {
      existing.authProvider = AuthProviderType.OIDC;
      existing.isActive = true;
      existing.externalIssuer = issuerUrl;
      existing.externalSubject = userInfo.sub?.trim() || existing.externalSubject;
      if (userInfo.name?.trim()) {
        existing.fullName = userInfo.name.trim();
      }
      existing.isAdmin = existing.roleKey === AppUserRole.PLATFORM_ADMIN;
      return this.userRepository.save(existing);
    }

    const displayName =
      userInfo.name?.trim() || userInfo.preferred_username?.trim() || email;

    return this.userRepository.save(
      this.userRepository.create({
        fullName: displayName,
        roleTitle: 'Miembro del equipo legal',
        email,
        passwordHash: hashPassword(randomUUID()),
        authProvider: AuthProviderType.OIDC,
        roleKey: AppUserRole.LEGAL_VIEWER,
        isAdmin: false,
        isActive: true,
        externalSubject: userInfo.sub?.trim() || null,
        externalIssuer: issuerUrl,
      }),
    );
  }

  private assertAllowedOidcEmail(email: string): void {
    const allowedDomains = this.authConfig.getOidcAllowedDomains();
    if (allowedDomains.length === 0) {
      return;
    }

    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain || !allowedDomains.includes(domain)) {
      throw new UnauthorizedException(
        'The SSO account is not allowed to access this workspace.',
      );
    }
  }
}
