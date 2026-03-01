import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { AuthRequest } from './auth-request.type';
import { AuthService } from './application/auth.service';
import { AppUserRole } from '../users/domain/app-user.entity';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const user = this.authService.ensureAuthenticated(request.currentUser);

    if (!user.isAdmin && user.roleKey !== AppUserRole.PLATFORM_ADMIN) {
      throw new ForbiddenException('Administrator privileges are required.');
    }

    return true;
  }
}
