import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';

import { AuthRequest } from '../../auth/auth-request.type';
import { CurrentUser } from '../../auth/current-user.decorator';
import { RequireRoles } from '../../auth/require-roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import { SessionAuthGuard } from '../../auth/session-auth.guard';
import {
  CreateUserDto,
  ResetPasswordDto,
  UpdateUserDto,
} from '../application/user.dto';
import { AppUser, AppUserRole } from '../domain/app-user.entity';
import { UsersService } from '../application/users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(SessionAuthGuard, RolesGuard)
  @RequireRoles(AppUserRole.PLATFORM_ADMIN)
  @Get()
  async listUsers() {
    return this.usersService.listUsers();
  }

  @UseGuards(SessionAuthGuard, RolesGuard)
  @RequireRoles(AppUserRole.PLATFORM_ADMIN)
  @Post()
  async createUser(
    @Body() dto: CreateUserDto,
    @CurrentUser() currentUser: AppUser,
    @Req() request: AuthRequest,
  ) {
    return this.usersService.createUser(dto, {
      actorUserId: currentUser.id,
      actorName: currentUser.fullName,
      correlationId: request.correlationId || null,
    });
  }

  @UseGuards(SessionAuthGuard, RolesGuard)
  @RequireRoles(AppUserRole.PLATFORM_ADMIN)
  @Patch(':userId')
  async updateUser(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() currentUser: AppUser,
    @Req() request: AuthRequest,
  ) {
    return this.usersService.updateUser(userId, dto, {
      actorUserId: currentUser.id,
      actorName: currentUser.fullName,
      correlationId: request.correlationId || null,
    });
  }

  @UseGuards(SessionAuthGuard, RolesGuard)
  @RequireRoles(AppUserRole.PLATFORM_ADMIN)
  @Put(':userId/password')
  async updateUserPassword(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: ResetPasswordDto,
    @CurrentUser() currentUser: AppUser,
    @Req() request: AuthRequest,
  ) {
    return this.usersService.resetPassword(userId, dto, {
      actorUserId: currentUser.id,
      actorName: currentUser.fullName,
      correlationId: request.correlationId || null,
    });
  }
}
