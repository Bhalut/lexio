import { Body, Controller, Post } from '@nestjs/common';

import {
  PasswordResetConfirmDto,
  PasswordResetRequestDto,
} from '../application/auth.dto';
import { AuthService } from '../application/auth.service';

@Controller('auth/password-resets')
export class PasswordResetsController {
  constructor(private readonly authService: AuthService) {}

  @Post()
  async createPasswordReset(@Body() dto: PasswordResetRequestDto) {
    return this.authService.requestPasswordReset(dto.email);
  }

  @Post('confirm')
  async confirmPasswordReset(@Body() dto: PasswordResetConfirmDto) {
    return this.authService.confirmPasswordReset(dto.token, dto.newPassword);
  }
}
