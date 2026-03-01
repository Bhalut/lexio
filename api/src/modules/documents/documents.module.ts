import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CaseActivity } from '../activity/domain/case-activity.entity';
import { AuthModule } from '../auth/auth.module';
import { CasesModule } from '../cases/cases.module';
import { CaseFile } from '../cases/domain/case-file.entity';
import { AppUser } from '../users/domain/app-user.entity';
import { DocumentDeliveriesController } from './adapters/document-deliveries.controller';
import { DocumentDeliveryRepositoryImpl } from './adapters/database/document-delivery.repository';
import { DocumentDeliveryOrmEntity } from './adapters/database/entities/document-delivery.orm-entity';
import { DocumentOrmEntity } from './adapters/database/entities/document.orm-entity';
import { LocalStorageAdapter } from './adapters/local-storage.adapter';
import {
  CreateDocumentDeliveryUseCase,
  ListDocumentDeliveriesUseCase,
} from './application';
import {
  DOCUMENT_DELIVERY_REPOSITORY,
} from './ports/document-delivery.repository';
import { STORAGE_PORT } from './ports/storage.port';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DocumentDeliveryOrmEntity,
      DocumentOrmEntity,
      CaseFile,
      CaseActivity,
      AppUser,
    ]),
    CasesModule,
    forwardRef(() => AuthModule),
  ],
  controllers: [DocumentDeliveriesController],
  providers: [
    CreateDocumentDeliveryUseCase,
    ListDocumentDeliveriesUseCase,
    {
      provide: STORAGE_PORT,
      useClass: LocalStorageAdapter,
    },
    {
      provide: DOCUMENT_DELIVERY_REPOSITORY,
      useClass: DocumentDeliveryRepositoryImpl,
    },
  ],
})
export class DocumentsModule {}
