import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';

import {
  DOCUMENT_DELIVERY_CATEGORIES,
  DOCUMENT_RELATED_PHASES,
} from '@lexio/documents-domain';

export class CreateDocumentDeliveryDto {
  @ApiProperty({ description: 'Title for this delivery' })
  @IsNotEmpty()
  @IsString()
  title!: string;

  @ApiProperty({ description: 'Description contextualizing the delivery' })
  @IsNotEmpty()
  @IsString()
  description!: string;

  @ApiProperty({
    description: 'Legal category for the delivery',
    enum: DOCUMENT_DELIVERY_CATEGORIES,
  })
  @IsNotEmpty()
  @IsString()
  @IsIn([...DOCUMENT_DELIVERY_CATEGORIES])
  category!: string;

  @ApiProperty({
    description: 'Case phase most related to this delivery',
    enum: DOCUMENT_RELATED_PHASES,
  })
  @IsNotEmpty()
  @IsString()
  @IsIn([...DOCUMENT_RELATED_PHASES])
  relatedPhase!: string;
}
