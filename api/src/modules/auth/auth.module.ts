import { Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppUser } from '../users/domain/app-user.entity';
import { AuthProvidersController } from './adapters/auth-providers.controller';
import { AuthSessionsController } from './adapters/auth-sessions.controller';
import { OidcController } from './adapters/oidc.controller';
import { PasswordResetsController } from './adapters/password-resets.controller';
import { AdminGuard } from './admin.guard';
import { AuthConfigService } from './application/auth-config.service';
import { AuthNotificationService } from './application/auth-notification.service';
import { AuthOidcService } from './application/auth-oidc.service';
import { AuthService } from './application/auth.service';
import { PasswordResetToken } from './domain/password-reset-token.entity';
import { UserSession } from './domain/user-session.entity';
import { RolesGuard } from './roles.guard';
import { SessionAuthGuard } from './session-auth.guard';

@Module({
  imports: [TypeOrmModule.forFeature([AppUser, UserSession, PasswordResetToken])],
  controllers: [
    AuthProvidersController,
    AuthSessionsController,
    OidcController,
    PasswordResetsController,
  ],
  providers: [
    AuthService,
    AuthConfigService,
    AuthOidcService,
    AuthNotificationService,
    SessionAuthGuard,
    AdminGuard,
    RolesGuard,
    Reflector,
  ],
  exports: [AuthService, SessionAuthGuard, AdminGuard, RolesGuard, TypeOrmModule],
})
export class AuthModule {}
