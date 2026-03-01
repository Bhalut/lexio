import { Controller, Get } from '@nestjs/common';

import { AuthService } from '../application/auth.service';

@Controller('auth/providers')
export class AuthProvidersController {
  constructor(private readonly authService: AuthService) {}

  @Get('current')
  getCurrentProviderConfig() {
    return this.authService.getProviderConfig();
  }
}
