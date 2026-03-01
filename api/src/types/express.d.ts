import type { AppUser } from '../modules/users/domain/app-user.entity';

declare module 'express-serve-static-core' {
  interface Request {
    currentUser?: AppUser | null;
  }
}
