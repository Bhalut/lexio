import { Controller, Get, Query, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';

import { AuthService } from '../application/auth.service';
import { extractCookie } from './cookie-helpers';

@Controller('auth/oidc')
export class OidcController {
  constructor(private readonly authService: AuthService) {}

  @Get('authorize')
  async authorize(@Res() res: Response) {
    const { authorizationUrl, state } = await this.authService.startSso();

    res.cookie(
      this.authService.getOidcStateCookieName(),
      state,
      this.authService.getTransientCookieOptions(1000 * 60 * 10),
    );

    return res.redirect(authorizationUrl);
  }

  @Get('callback')
  async handleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const expectedState = extractCookie(
      req.headers.cookie,
      this.authService.getOidcStateCookieName(),
    );
    res.clearCookie(
      this.authService.getOidcStateCookieName(),
      this.authService.getClearedCookieOptions(),
    );

    try {
      const { session } = await this.authService.handleSsoCallback(
        code,
        state,
        expectedState,
      );

      res.cookie(
        this.authService.getSessionCookieName(),
        session.sessionToken,
        this.authService.getSessionCookieOptions(session.expiresAt),
      );

      return res.redirect(this.authService.getSsoRedirectUrl());
    } catch {
      return res.redirect(`${this.authService.getSsoRedirectUrl()}?authError=sso`);
    }
  }
}
