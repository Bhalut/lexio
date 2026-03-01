import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  MinLength,
} from 'class-validator';

import { AppUserRole, AuthProviderType } from '../domain/app-user.entity';

export class CreateUserDto {
  @IsNotEmpty()
  fullName!: string;

  @IsNotEmpty()
  roleTitle!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @MinLength(8)
  password?: string;

  @IsOptional()
  @IsEnum(AuthProviderType)
  authProvider?: AuthProviderType;

  @IsOptional()
  @IsEnum(AppUserRole)
  roleKey?: AppUserRole;

  @IsOptional()
  @IsBoolean()
  isAdmin?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateUserDto {
  @IsOptional()
  @IsNotEmpty()
  fullName?: string;

  @IsOptional()
  @IsNotEmpty()
  roleTitle?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsEnum(AuthProviderType)
  authProvider?: AuthProviderType;

  @IsOptional()
  @IsEnum(AppUserRole)
  roleKey?: AppUserRole;

  @IsOptional()
  @IsBoolean()
  isAdmin?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ResetPasswordDto {
  @MinLength(8)
  @IsNotEmpty()
  newPassword!: string;
}
