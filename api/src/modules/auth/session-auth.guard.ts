import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

import { AuthService } from './application/auth.service';
import { AuthRequest } from './auth-request.type';

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    this.authService.ensureAuthenticated(request.currentUser);
    return true;
  }
}
