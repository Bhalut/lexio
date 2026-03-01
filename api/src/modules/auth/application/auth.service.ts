import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomUUID } from 'crypto';
import { MoreThan, Repository } from 'typeorm';

import {
  AppUser,
  AuthProviderType,
} from '../../users/domain/app-user.entity';
import { AuthNotificationService } from './auth-notification.service';
import { UserSession } from '../domain/user-session.entity';
import { PasswordResetToken } from '../domain/password-reset-token.entity';
import { hashPassword, verifyPassword } from './password-hash';
import { AuthConfigService } from './auth-config.service';
import { AuthOidcService } from './auth-oidc.service';
import {
  AuthenticatedSession,
  AuthProviderConfig,
} from './auth.types';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(AppUser)
    private readonly userRepository: Repository<AppUser>,
    @InjectRepository(UserSession)
    private readonly sessionRepository: Repository<UserSession>,
    @InjectRepository(PasswordResetToken)
    private readonly passwordResetTokenRepository: Repository<PasswordResetToken>,
    private readonly notifications: AuthNotificationService,
    private readonly authConfig: AuthConfigService,
    private readonly authOidc: AuthOidcService,
  ) {}

  async login(email: string, password: string): Promise<AuthenticatedSession> {
    if (!this.authConfig.isLocalAuthEnabled()) {
      throw new UnauthorizedException('Local authentication is disabled.');
    }

    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('LOWER(user.email) = LOWER(:email)', { email })
      .getOne();

    if (
      !user ||
      user.authProvider === AuthProviderType.OIDC ||
      !user.isActive ||
      !verifyPassword(password, user.passwordHash)
    ) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const session = await this.createSessionForUser(user);
    const safeUser = await this.userRepository.findOneOrFail({
      where: { id: user.id },
    });

    return { session, user: safeUser };
  }

  async getUserFromSessionToken(token?: string | null): Promise<AppUser | null> {
    if (!token) {
      return null;
    }

    const session = await this.sessionRepository.findOne({
      where: {
        sessionToken: token,
        expiresAt: MoreThan(new Date()),
      },
      relations: ['user'],
    });

    return session?.user || null;
  }

  async deleteSession(token?: string | null): Promise<{ redirectUrl: string | null }> {
    if (!token) {
      return { redirectUrl: null };
    }

    const session = await this.sessionRepository.findOne({
      where: { sessionToken: token },
      relations: ['user'],
    });

    if (!session) {
      return { redirectUrl: null };
    }

    const redirectUrl = await this.buildLogoutRedirectUrl(session);
    await this.sessionRepository.delete({ id: session.id });
    return { redirectUrl };
  }

  ensureAuthenticated(user?: AppUser | null): AppUser {
    if (!user) {
      throw new UnauthorizedException('A valid session is required.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('The user account is inactive.');
    }

    return user;
  }

  getProviderConfig(): AuthProviderConfig {
    return this.authConfig.getProviderConfig();
  }

  async startSso(): Promise<{ authorizationUrl: string; state: string }> {
    return this.authOidc.startAuthorization();
  }

  async handleSsoCallback(
    code: string,
    state: string,
    expectedState?: string | null,
  ): Promise<AuthenticatedSession> {
    const { user, idToken } = await this.authOidc.exchangeAuthorizationCode(
      code,
      state,
      expectedState,
    );
    const session = await this.createSessionForUser(user, idToken);
    const safeUser = await this.userRepository.findOneOrFail({
      where: { id: user.id },
    });

    return { session, user: safeUser };
  }

  getSsoRedirectUrl(): string {
    return this.authConfig.getSsoRedirectUrl();
  }

  async requestPasswordReset(email: string): Promise<{ success: true }> {
    if (!this.authConfig.isLocalAuthEnabled()) {
      return { success: true };
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.userRepository.findOne({ where: { email: normalizedEmail } });
    if (!user || !user.isActive || user.authProvider !== AuthProviderType.LOCAL) {
      return { success: true };
    }

    const now = new Date();
    await this.passwordResetTokenRepository
      .createQueryBuilder()
      .update(PasswordResetToken)
      .set({ usedAt: now })
      .where('"userId" = :userId AND "usedAt" IS NULL', { userId: user.id })
      .execute();

    const rawToken = `${randomUUID()}${randomUUID()}`;
    const expiresAt = new Date(
      Date.now() + this.authConfig.getPasswordResetTokenTtlMinutes() * 60 * 1000,
    );

    await this.passwordResetTokenRepository.save(
      this.passwordResetTokenRepository.create({
        userId: user.id,
        tokenHash: hashOpaqueToken(rawToken),
        expiresAt,
      }),
    );

    await this.notifications.sendPasswordResetEmail({
      to: user.email,
      fullName: user.fullName,
      resetUrl: this.authConfig.buildPasswordResetUrl(rawToken, user.email),
      expiresAt,
    });

    return { success: true };
  }

  async confirmPasswordReset(
    token: string,
    newPassword: string,
  ): Promise<{ success: true }> {
    if (!this.authConfig.isLocalAuthEnabled()) {
      throw new BadRequestException('Password reset is not available.');
    }

    const passwordResetToken = await this.passwordResetTokenRepository.findOne({
      where: {
        tokenHash: hashOpaqueToken(token),
        expiresAt: MoreThan(new Date()),
      },
      relations: ['user'],
    });

    if (!passwordResetToken || passwordResetToken.usedAt) {
      throw new BadRequestException('Invalid or expired password reset token.');
    }

    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.id = :id', { id: passwordResetToken.userId })
      .getOne();

    if (!user || !user.isActive) {
      throw new BadRequestException('The account associated with this token is unavailable.');
    }

    user.passwordHash = hashPassword(newPassword);
    if (user.authProvider === AuthProviderType.OIDC) {
      user.authProvider = AuthProviderType.LOCAL;
      user.externalSubject = null;
      user.externalIssuer = null;
    }

    await this.userRepository.save(user);
    passwordResetToken.usedAt = new Date();
    await this.passwordResetTokenRepository.save(passwordResetToken);
    await this.sessionRepository.delete({ userId: user.id });

    return { success: true };
  }

  getSessionCookieName(): string {
    return this.authConfig.getSessionCookieName();
  }

  getOidcStateCookieName(): string {
    return this.authConfig.getOidcStateCookieName();
  }

  getSessionCookieOptions(expiresAt: Date) {
    return this.authConfig.getSessionCookieOptions(expiresAt);
  }

  getTransientCookieOptions(maxAge: number) {
    return this.authConfig.getTransientCookieOptions(maxAge);
  }

  getClearedCookieOptions() {
    return this.authConfig.getClearedCookieOptions();
  }

  private async createSessionForUser(
    user: AppUser,
    idToken?: string | null,
  ): Promise<UserSession> {
    const session = this.sessionRepository.create({
      id: randomUUID(),
      userId: user.id,
      sessionToken: randomUUID(),
      idToken: idToken || null,
      expiresAt: new Date(
        Date.now() + this.authConfig.getSessionTtlHours() * 60 * 60 * 1000,
      ),
    });

    return this.sessionRepository.save(session);
  }

  private async buildLogoutRedirectUrl(session: UserSession): Promise<string | null> {
    return this.authOidc.buildLogoutRedirectUrl(session);
  }
}

function hashOpaqueToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
