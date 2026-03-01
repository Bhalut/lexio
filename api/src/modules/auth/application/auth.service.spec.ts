import { UnauthorizedException } from '@nestjs/common';

import { AuthConfigService } from './auth-config.service';
import { AuthNotificationService } from './auth-notification.service';
import { AuthOidcService } from './auth-oidc.service';
import { AuthService } from './auth.service';
import { hashPassword } from './password-hash';
import { AppUser, AuthProviderType } from '../../users/domain/app-user.entity';
import { PasswordResetToken } from '../domain/password-reset-token.entity';

type MockRepo = {
  create: jest.Mock;
  createQueryBuilder: jest.Mock;
  delete: jest.Mock;
  findOne: jest.Mock;
  findOneOrFail: jest.Mock;
  save: jest.Mock;
};

function createMockRepo(): MockRepo {
  return {
    create: jest.fn((value) => value),
    createQueryBuilder: jest.fn(),
    delete: jest.fn(),
    findOne: jest.fn(),
    findOneOrFail: jest.fn(),
    save: jest.fn(),
  };
}

describe('AuthService', () => {
  let userRepository: MockRepo;
  let sessionRepository: MockRepo;
  let passwordResetTokenRepository: MockRepo;
  let notifications: jest.Mocked<AuthNotificationService>;
  let authConfig: jest.Mocked<AuthConfigService>;
  let authOidc: jest.Mocked<AuthOidcService>;
  let service: AuthService;

  beforeEach(() => {
    userRepository = createMockRepo();
    sessionRepository = createMockRepo();
    passwordResetTokenRepository = createMockRepo();
    notifications = {
      sendPasswordResetEmail: jest.fn(),
    } as unknown as jest.Mocked<AuthNotificationService>;
    authConfig = {
      buildPasswordResetUrl: jest.fn(),
      getClearedCookieOptions: jest.fn(),
      getOidcStateCookieName: jest.fn(),
      getPasswordResetTokenTtlMinutes: jest.fn(),
      getProviderConfig: jest.fn(),
      getSessionCookieName: jest.fn(),
      getSessionCookieOptions: jest.fn(),
      getSessionTtlHours: jest.fn(),
      getSsoRedirectUrl: jest.fn(),
      getTransientCookieOptions: jest.fn(),
      isLocalAuthEnabled: jest.fn(),
    } as unknown as jest.Mocked<AuthConfigService>;
    authOidc = {
      buildLogoutRedirectUrl: jest.fn(),
      exchangeAuthorizationCode: jest.fn(),
      startAuthorization: jest.fn(),
    } as unknown as jest.Mocked<AuthOidcService>;

    authConfig.getSessionTtlHours.mockReturnValue(24);
    service = new AuthService(
      userRepository as never,
      sessionRepository as never,
      passwordResetTokenRepository as never,
      notifications,
      authConfig,
      authOidc,
    );
  });

  it('creates a session for a valid local login', async () => {
    const storedUser = {
      id: 'user-1',
      email: 'carlos@lexio.local',
      fullName: 'Carlos Mendoza',
      authProvider: AuthProviderType.LOCAL,
      isActive: true,
      passwordHash: hashPassword('SecretPass1!'),
    } as AppUser;
    const safeUser = {
      id: storedUser.id,
      email: storedUser.email,
      fullName: storedUser.fullName,
      authProvider: storedUser.authProvider,
      isActive: true,
    } as AppUser;

    userRepository.createQueryBuilder.mockReturnValue({
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(storedUser),
    });
    userRepository.findOneOrFail.mockResolvedValue(safeUser);
    sessionRepository.save.mockImplementation(async (session) => session);

    authConfig.isLocalAuthEnabled.mockReturnValue(true);

    const result = await service.login(storedUser.email, 'SecretPass1!');

    expect(result.user).toBe(safeUser);
    expect(result.session.userId).toBe(storedUser.id);
    expect(result.session.sessionToken).toBeDefined();
    expect(sessionRepository.save).toHaveBeenCalledTimes(1);
  });

  it('rejects local login when local auth is disabled', async () => {
    authConfig.isLocalAuthEnabled.mockReturnValue(false);

    await expect(
      service.login('carlos@lexio.local', 'SecretPass1!'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('confirms a password reset and converts OIDC accounts to local auth', async () => {
    const resetToken = {
      id: 'reset-1',
      userId: 'user-1',
      tokenHash: 'hashed-token',
      expiresAt: new Date(Date.now() + 60_000),
      usedAt: null,
    } as PasswordResetToken;
    const storedUser = {
      id: 'user-1',
      email: 'ana@lexio.local',
      fullName: 'Ana Ramirez',
      authProvider: AuthProviderType.OIDC,
      isActive: true,
      passwordHash: hashPassword('OldSecret1!'),
      externalIssuer: 'https://issuer.example',
      externalSubject: 'subject-1',
    } as AppUser;

    authConfig.isLocalAuthEnabled.mockReturnValue(true);
    passwordResetTokenRepository.findOne.mockResolvedValue(resetToken);
    userRepository.createQueryBuilder.mockReturnValue({
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(storedUser),
    });

    await service.confirmPasswordReset('opaque-token', 'NewSecret1!');

    expect(storedUser.authProvider).toBe(AuthProviderType.LOCAL);
    expect(storedUser.externalIssuer).toBeNull();
    expect(storedUser.externalSubject).toBeNull();
    expect(storedUser.passwordHash).not.toBe(hashPassword('OldSecret1!'));
    expect(passwordResetTokenRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        usedAt: expect.any(Date),
      }),
    );
    expect(sessionRepository.delete).toHaveBeenCalledWith({ userId: storedUser.id });
  });
});
