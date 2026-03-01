import { SetMetadata } from '@nestjs/common';

import { AppUserRole } from '../users/domain/app-user.entity';

export const AUTHORIZED_ROLES_KEY = 'authorized_roles';
export const RequireRoles = (...roles: AppUserRole[]) =>
  SetMetadata(AUTHORIZED_ROLES_KEY, roles);
