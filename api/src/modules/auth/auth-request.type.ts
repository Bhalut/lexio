import { Request } from 'express';

import { AppUser } from '../users/domain/app-user.entity';

export type AuthRequest = Request & {
  currentUser?: AppUser | null;
  correlationId?: string | null;
};
