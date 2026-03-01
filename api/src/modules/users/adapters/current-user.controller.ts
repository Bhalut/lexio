import { Controller, Get, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../../auth/current-user.decorator';
import { SessionAuthGuard } from '../../auth/session-auth.guard';
import { AppUser } from '../domain/app-user.entity';
import { UsersService } from '../application/users.service';

@Controller('users/me')
export class CurrentUserController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(SessionAuthGuard)
  @Get()
  async getCurrentUser(@CurrentUser() currentUser: AppUser) {
    return this.usersService.getById(currentUser.id);
  }
}
