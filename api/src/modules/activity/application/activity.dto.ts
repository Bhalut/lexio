import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ActivityType } from '../domain/case-activity.entity';

export class CreateActivityDto {
  @IsEnum(ActivityType)
  @IsNotEmpty()
  type!: ActivityType;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsString()
  @IsOptional()
  metadata?: string; // JSON string

  @IsString()
  @IsNotEmpty()
  authorName!: string;

  @IsString()
  @IsOptional()
  authorAvatar?: string;
}
