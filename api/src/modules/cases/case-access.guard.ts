import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { isUUID } from 'class-validator';

import { AuthService } from '../auth/application/auth.service';
import { AuthRequest } from '../auth/auth-request.type';
import { CaseAccessService } from './application/case-access.service';
import { CaseAccessLevel } from './domain/case-assignment.entity';
import { REQUIRED_CASE_ACCESS_KEY } from './require-case-access.decorator';

@Injectable()
export class CaseAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
    private readonly caseAccessService: CaseAccessService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredAccessLevel = this.reflector.getAllAndOverride<CaseAccessLevel>(
      REQUIRED_CASE_ACCESS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredAccessLevel) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthRequest>();
    const user = this.authService.ensureAuthenticated(request.currentUser);
    const caseId = request.params?.['caseId'];

    if (!caseId) {
      throw new BadRequestException('caseId route parameter is required.');
    }

    if (!isUUID(caseId)) {
      throw new BadRequestException('caseId must be a valid UUID.');
    }

    await this.caseAccessService.assertCaseAccess(caseId, user, requiredAccessLevel);
    return true;
  }
}
