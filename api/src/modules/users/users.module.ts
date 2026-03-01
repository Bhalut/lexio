import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { CurrentUserController } from './adapters/current-user.controller';
import { UsersController } from './adapters/users.controller';
import { UsersService } from './application/users.service';
import { AppUser } from './domain/app-user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AppUser]), AuditModule, AuthModule],
  controllers: [CurrentUserController, UsersController],
  providers: [UsersService],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}
