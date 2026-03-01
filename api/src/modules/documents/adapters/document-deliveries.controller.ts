/// <reference types="multer" />
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { Repository } from 'typeorm';

import {
  MAX_FILE_SIZE,
  MAX_FILES_PER_DELIVERY,
  validateUploadFiles,
} from '@lexio/documents-domain';
import {
  ActivityType,
  CaseActivity,
} from '../../activity/domain/case-activity.entity';
import { CurrentUser } from '../../auth/current-user.decorator';
import { RequireRoles } from '../../auth/require-roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import { SessionAuthGuard } from '../../auth/session-auth.guard';
import { CaseAccessGuard } from '../../cases/case-access.guard';
import { CaseAccessLevel } from '../../cases/domain/case-assignment.entity';
import { CaseFile } from '../../cases/domain/case-file.entity';
import { RequireCaseAccess } from '../../cases/require-case-access.decorator';
import { AppUser, AppUserRole } from '../../users/domain/app-user.entity';
import {
  CreateDocumentDeliveryUseCase,
  ListDocumentDeliveriesUseCase,
} from '../application';
import { CreateDocumentDeliveryDto } from './dto/create-document-delivery.dto';

@ApiTags('Document Deliveries')
@Controller('cases/:caseId/document-deliveries')
export class DocumentDeliveriesController {
  constructor(
    private readonly createDelivery: CreateDocumentDeliveryUseCase,
    private readonly listDeliveries: ListDocumentDeliveriesUseCase,
    @InjectRepository(CaseFile)
    private readonly caseRepository: Repository<CaseFile>,
    @InjectRepository(CaseActivity)
    private readonly activityRepository: Repository<CaseActivity>,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Upload a document delivery to a case' })
  @ApiParam({ name: 'caseId', description: 'UUID of the case' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Document delivery with files',
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        category: { type: 'string' },
        relatedPhase: { type: 'string' },
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
      required: ['title', 'description', 'category', 'relatedPhase', 'files'],
    },
  })
  @UseGuards(ThrottlerGuard, SessionAuthGuard, RolesGuard, CaseAccessGuard)
  @RequireCaseAccess(CaseAccessLevel.EDITOR)
  @RequireRoles(
    AppUserRole.PLATFORM_ADMIN,
    AppUserRole.LEGAL_MANAGER,
    AppUserRole.LEGAL_OPERATOR,
  )
  @Throttle({ short: { limit: 5, ttl: 60000 } })
  @UseInterceptors(
    FilesInterceptor('files', MAX_FILES_PER_DELIVERY, {
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  async create(
    @Param('caseId', ParseUUIDPipe) caseId: string,
    @Body() dto: CreateDocumentDeliveryDto,
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser() currentUser: AppUser,
  ) {
    const caseFile = await this.caseRepository.findOne({ where: { id: caseId } });
    if (!caseFile) {
      throw new NotFoundException(`Case with ID ${caseId} not found`);
    }

    if (!files || files.length === 0) {
      throw new BadRequestException('At least one file is required.');
    }

    const { valid, invalidFiles } = validateUploadFiles(files);
    if (!valid) {
      const names = invalidFiles.join(', ');
      throw new BadRequestException(
        `Unsupported file type(s): ${names}. Allowed: PDF, DOCX, XLSX, images, ZIP.`,
      );
    }

    const delivery = await this.createDelivery.execute({
      caseId,
      title: dto.title,
      description: dto.description,
      category: dto.category,
      relatedPhase: dto.relatedPhase,
      createdByUserId: currentUser.id,
      createdByName: currentUser.fullName,
      files: files.map((file) => ({
        originalName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        buffer: file.buffer,
      })),
    });

    await this.activityRepository.save(
      this.activityRepository.create({
        caseId,
        type: ActivityType.UPLOAD,
        description: `Registró la entrega "${delivery.title}" (${delivery.category} · ${delivery.relatedPhase}).`,
        authorName: currentUser.fullName,
      }),
    );

    return delivery;
  }

  @Get()
  @ApiOperation({ summary: 'List all document deliveries for a case' })
  @ApiParam({ name: 'caseId', description: 'UUID of the case' })
  @UseGuards(SessionAuthGuard, CaseAccessGuard)
  @RequireCaseAccess(CaseAccessLevel.VIEWER)
  async list(@Param('caseId', ParseUUIDPipe) caseId: string) {
    return this.listDeliveries.execute(caseId);
  }
}
