import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { AppUserRole } from '../users/domain/app-user.entity';
import { AuthService } from './application/auth.service';
import { AuthRequest } from './auth-request.type';
import { AUTHORIZED_ROLES_KEY } from './require-roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<AppUserRole[]>(
      AUTHORIZED_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthRequest>();
    const user = this.authService.ensureAuthenticated(request.currentUser);

    if (!requiredRoles.includes(user.roleKey)) {
      throw new ForbiddenException('The current role cannot perform this action.');
    }

    return true;
  }
}
