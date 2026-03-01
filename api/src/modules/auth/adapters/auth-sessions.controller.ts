import { Body, Controller, Delete, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';

import { LoginDto } from '../application/auth.dto';
import { AuthService } from '../application/auth.service';
import { extractSessionToken } from './cookie-helpers';

@Controller('auth/sessions')
export class AuthSessionsController {
  constructor(private readonly authService: AuthService) {}

  @Post()
  async createSession(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { session, user } = await this.authService.login(dto.email, dto.password);

    res.cookie(
      this.authService.getSessionCookieName(),
      session.sessionToken,
      this.authService.getSessionCookieOptions(session.expiresAt),
    );

    return {
      success: true,
      expiresAt: session.expiresAt,
      user,
    };
  }

  @Delete('current')
  async deleteCurrentSession(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = extractSessionToken(
      req.headers.cookie,
      this.authService.getSessionCookieName(),
    );
    const { redirectUrl } = await this.authService.deleteSession(token);

    res.clearCookie(
      this.authService.getSessionCookieName(),
      this.authService.getClearedCookieOptions(),
    );

    return { success: true, redirectUrl };
  }
}
