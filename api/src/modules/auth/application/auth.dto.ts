import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsNotEmpty()
  @MinLength(8)
  password!: string;
}

export class PasswordResetRequestDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;
}

export class PasswordResetConfirmDto {
  @IsNotEmpty()
  token!: string;

  @IsNotEmpty()
  @MinLength(8)
  newPassword!: string;
}
