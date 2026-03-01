import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';

import { AuditService } from '../../audit/application/audit.service';
import {
  AuditActionType,
  AuditEntityType,
} from '../../audit/domain/audit-event.entity';
import { hashPassword } from '../../auth/application/password-hash';
import { CreateUserDto, ResetPasswordDto, UpdateUserDto } from './user.dto';
import {
  AppUser,
  AppUserRole,
  AuthProviderType,
} from '../domain/app-user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(AppUser)
    private readonly userRepository: Repository<AppUser>,
    private readonly auditService: AuditService,
  ) {}

  async getById(id: string): Promise<AppUser> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async listUsers(): Promise<AppUser[]> {
    return this.userRepository.find({
      order: {
        roleKey: 'ASC',
        fullName: 'ASC',
      },
    });
  }

  async createUser(
    dto: CreateUserDto,
    actor?: {
      actorUserId?: string | null;
      actorName?: string | null;
      correlationId?: string | null;
    },
  ): Promise<AppUser> {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.userRepository.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException(`User with email ${email} already exists.`);
    }

    const authProvider = dto.authProvider ?? AuthProviderType.LOCAL;
    const roleKey = this.normalizeRoleKey(dto.roleKey, dto.isAdmin);
    const passwordSource =
      authProvider === AuthProviderType.LOCAL
        ? dto.password
        : dto.password || randomUUID();

    if (authProvider === AuthProviderType.LOCAL && !passwordSource) {
      throw new BadRequestException('A password is required for local users.');
    }

    const user = this.userRepository.create({
      fullName: dto.fullName.trim(),
      roleTitle: dto.roleTitle.trim(),
      email,
      passwordHash: hashPassword(passwordSource || randomUUID()),
      authProvider,
      roleKey,
      isAdmin: roleKey === AppUserRole.PLATFORM_ADMIN,
      isActive: dto.isActive ?? true,
      externalSubject: null,
      externalIssuer: null,
    });

    const savedUser = await this.userRepository.save(user);
    await this.auditService.logEvent({
      actionType: AuditActionType.USER_CREATED,
      entityType: AuditEntityType.USER,
      entityId: savedUser.id,
      targetUserId: savedUser.id,
      actorUserId: actor?.actorUserId || null,
      actorName: actor?.actorName || null,
      correlationId: actor?.correlationId || null,
      summary: `${actor?.actorName || 'Sistema'} creó la cuenta ${savedUser.email}.`,
      metadata: {
        email: savedUser.email,
        roleKey: savedUser.roleKey,
        authProvider: savedUser.authProvider,
        isActive: savedUser.isActive,
      },
    });
    return savedUser;
  }

  async updateUser(
    id: string,
    dto: UpdateUserDto,
    actor?: {
      actorUserId?: string | null;
      actorName?: string | null;
      correlationId?: string | null;
    },
  ): Promise<AppUser> {
    const user = await this.getById(id);
    const previousSnapshot = {
      email: user.email,
      fullName: user.fullName,
      roleTitle: user.roleTitle,
      authProvider: user.authProvider,
      roleKey: user.roleKey,
      isActive: user.isActive,
    };

    if (dto.email) {
      const normalizedEmail = dto.email.trim().toLowerCase();
      const existing = await this.userRepository.findOne({
        where: { email: normalizedEmail },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `User with email ${normalizedEmail} already exists.`,
        );
      }
      user.email = normalizedEmail;
    }

    if (dto.fullName !== undefined) {
      user.fullName = dto.fullName.trim();
    }

    if (dto.roleTitle !== undefined) {
      user.roleTitle = dto.roleTitle.trim();
    }

    if (dto.authProvider !== undefined) {
      user.authProvider = dto.authProvider;
      if (dto.authProvider === AuthProviderType.LOCAL) {
        user.externalSubject = null;
        user.externalIssuer = null;
      }
    }

    if (dto.roleKey !== undefined || dto.isAdmin !== undefined) {
      user.roleKey = this.normalizeRoleKey(dto.roleKey, dto.isAdmin, user.roleKey);
      user.isAdmin = user.roleKey === AppUserRole.PLATFORM_ADMIN;
    }

    if (dto.isActive !== undefined) {
      user.isActive = dto.isActive;
    }

    const savedUser = await this.userRepository.save(user);
    await this.auditService.logEvent({
      actionType: AuditActionType.USER_UPDATED,
      entityType: AuditEntityType.USER,
      entityId: savedUser.id,
      targetUserId: savedUser.id,
      actorUserId: actor?.actorUserId || null,
      actorName: actor?.actorName || null,
      correlationId: actor?.correlationId || null,
      summary: `${actor?.actorName || 'Sistema'} actualizó la cuenta ${savedUser.email}.`,
      metadata: {
        before: previousSnapshot,
        after: {
          email: savedUser.email,
          fullName: savedUser.fullName,
          roleTitle: savedUser.roleTitle,
          authProvider: savedUser.authProvider,
          roleKey: savedUser.roleKey,
          isActive: savedUser.isActive,
        },
      },
    });
    return savedUser;
  }

  async resetPassword(
    id: string,
    dto: ResetPasswordDto,
    actor?: {
      actorUserId?: string | null;
      actorName?: string | null;
      correlationId?: string | null;
    },
  ): Promise<AppUser> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.id = :id', { id })
      .getOne();

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    user.passwordHash = hashPassword(dto.newPassword);
    if (user.authProvider === AuthProviderType.OIDC) {
      user.authProvider = AuthProviderType.LOCAL;
      user.externalIssuer = null;
      user.externalSubject = null;
    }

    await this.userRepository.save(user);
    const savedUser = await this.getById(id);
    await this.auditService.logEvent({
      actionType: AuditActionType.USER_PASSWORD_RESET,
      entityType: AuditEntityType.USER,
      entityId: savedUser.id,
      targetUserId: savedUser.id,
      actorUserId: actor?.actorUserId || null,
      actorName: actor?.actorName || null,
      correlationId: actor?.correlationId || null,
      summary: `${actor?.actorName || 'Sistema'} restableció la contraseña de ${savedUser.email}.`,
      metadata: {
        authProvider: savedUser.authProvider,
      },
    });
    return savedUser;
  }

  private normalizeRoleKey(
    roleKey?: AppUserRole,
    isAdmin?: boolean,
    fallback: AppUserRole = AppUserRole.LEGAL_OPERATOR,
  ): AppUserRole {
    if (roleKey) {
      return roleKey;
    }

    if (isAdmin) {
      return AppUserRole.PLATFORM_ADMIN;
    }

    return fallback;
  }
}
