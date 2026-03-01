import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

import { AuthService } from './application/auth.service';
import { AuthRequest } from './auth-request.type';

@Injectable()
export class AuthSessionMiddleware implements NestMiddleware {
  constructor(private readonly authService: AuthService) {}

  async use(req: Request, _res: Response, next: NextFunction): Promise<void> {
    const authRequest = req as AuthRequest;
    const token = extractSessionToken(
      req.headers.cookie,
      this.authService.getSessionCookieName(),
    );
    authRequest.currentUser = await this.authService.getUserFromSessionToken(token);
    next();
  }
}

function extractSessionToken(
  cookieHeader: string | undefined,
  cookieName: string,
): string | null {
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(';');
  for (const cookie of cookies) {
    const [key, ...rest] = cookie.trim().split('=');
    if (key === cookieName) {
      return rest.join('=') || null;
    }
  }

  return null;
}
