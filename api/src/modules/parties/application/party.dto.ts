import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePartyDto {
  @IsString()
  @IsNotEmpty()
  role!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  detail?: string;

  @IsInt()
  @Min(0)
  @Max(999)
  @IsOptional()
  sortOrder?: number;
}

export class UpdatePartyDto {
  @IsString()
  @IsOptional()
  role?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  detail?: string;

  @IsInt()
  @Min(0)
  @Max(999)
  @IsOptional()
  sortOrder?: number;
}

export class ReorderPartyItemDto {
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsInt()
  @Min(0)
  sortOrder!: number;
}

export class ReorderPartiesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderPartyItemDto)
  items!: ReorderPartyItemDto[];
}
