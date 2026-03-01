import { INestApplication } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { CaseActivity } from '../../activity/domain/case-activity.entity';
import { hashPassword } from '../../auth/application/password-hash';
import { CaseFile } from '../../cases/domain/case-file.entity';
import { CaseStatus } from '../../cases/domain/case-status.enum';
import { AppUser } from '../../users/domain/app-user.entity';
import { databaseConfig, storageConfig } from '../../../config';
import { DocumentDeliveryOrmEntity } from '../adapters/database/entities/document-delivery.orm-entity';
import { DocumentOrmEntity } from '../adapters/database/entities/document.orm-entity';
import { CasesModule } from '../../cases/cases.module';
import { DocumentsModule } from '../documents.module';

const describeIfDatabase =
  process.env.RUN_DB_INTEGRATION_TESTS === '1' ? describe : describe.skip;

describeIfDatabase('DocumentsModule Integration', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [databaseConfig, storageConfig],
        }),
        TypeOrmModule.forRootAsync({
          inject: [ConfigService],
          useFactory: (config: ConfigService) => ({
            type: 'postgres',
            url: config.get<string>('database.url'),
            entities: [
              CaseFile,
              AppUser,
              DocumentDeliveryOrmEntity,
              DocumentOrmEntity,
              CaseActivity,
            ],
            synchronize: true,
          }),
        }),
        ThrottlerModule.forRoot([{ name: 'short', ttl: 60000, limit: 10 }]),
        CasesModule,
        DocumentsModule,
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
    dataSource = module.get(DataSource);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  beforeEach(async () => {
    await dataSource.query('DELETE FROM documents');
    await dataSource.query('DELETE FROM document_batches');
  });

  describe('CreateDocumentDeliveryUseCase', () => {
    it('persists a delivery with documents to the database', async () => {
      const { CreateDocumentDeliveryUseCase } = await import(
        '../application/create-document-delivery.use-case'
      );
      const useCase = app.get(CreateDocumentDeliveryUseCase);

      const caseRepo = dataSource.getRepository(CaseFile);
      const userRepo = dataSource.getRepository(AppUser);
      let testCase = await caseRepo.findOne({ where: {} });
      let testUser = await userRepo.findOne({ where: {} });

      if (!testUser) {
        testUser = await userRepo.save(
          userRepo.create({
            fullName: 'Integration Test User',
            roleTitle: 'QA Counsel',
            email: 'integration.user@lexio.local',
            passwordHash: hashPassword('IntegrationPass1!'),
          }),
        );
      }

      if (!testCase) {
        testCase = await caseRepo.save(
          caseRepo.create({
            caseNumber: 'INT-TEST-001',
            clientName: 'Integration Test Client',
            status: CaseStatus.ACTIVE,
            stage: 'Test stage',
            responsibleUserName: 'Test User',
          }),
        );
      }

      const result = await useCase.execute({
        caseId: testCase.id,
        title: 'Integration Test Delivery',
        description: 'Created during integration test',
        category: 'Pruebas documentales',
        relatedPhase: 'Fase probatoria',
        createdByUserId: testUser.id,
        createdByName: 'Test User',
        files: [
          {
            originalName: 'test.pdf',
            mimeType: 'application/pdf',
            sizeBytes: 100,
            buffer: Buffer.from('test-content'),
          },
        ],
      });

      expect(result.id).toBeDefined();
      expect(result.title).toBe('Integration Test Delivery');
      expect(result.documents).toHaveLength(1);
      expect(result.documents[0].originalName).toBe('test.pdf');
      expect(result.documents[0].checksum).toHaveLength(64);

      const deliveryRepository = dataSource.getRepository(DocumentDeliveryOrmEntity);
      const fetched = await deliveryRepository.findOne({
        where: { id: result.id },
        relations: ['documents'],
      });

      expect(fetched).toBeDefined();
      expect(fetched?.documents).toHaveLength(1);
    });
  });

  describe('ListDocumentDeliveriesUseCase', () => {
    it('returns deliveries in descending order', async () => {
      const { CreateDocumentDeliveryUseCase } = await import(
        '../application/create-document-delivery.use-case'
      );
      const { ListDocumentDeliveriesUseCase } = await import(
        '../application/list-document-deliveries.use-case'
      );
      const createUseCase = app.get(CreateDocumentDeliveryUseCase);
      const listUseCase = app.get(ListDocumentDeliveriesUseCase);

      const caseRepo = dataSource.getRepository(CaseFile);
      const userRepo = dataSource.getRepository(AppUser);
      let testCase = await caseRepo.findOne({ where: {} });
      let testUser = await userRepo.findOne({ where: {} });

      if (!testUser) {
        testUser = await userRepo.save(
          userRepo.create({
            fullName: 'Integration Test User',
            roleTitle: 'QA Counsel',
            email: 'integration.user@lexio.local',
            passwordHash: hashPassword('IntegrationPass1!'),
          }),
        );
      }

      if (!testCase) {
        testCase = await caseRepo.save(
          caseRepo.create({
            caseNumber: 'INT-TEST-002',
            clientName: 'Integration Test Client 2',
            status: CaseStatus.ACTIVE,
            stage: 'Test stage',
            responsibleUserName: 'Test User',
          }),
        );
      }

      await createUseCase.execute({
        caseId: testCase.id,
        title: 'First Delivery',
        description: 'Created first',
        category: 'Demanda y contestación',
        relatedPhase: 'Demanda',
        createdByUserId: testUser.id,
        createdByName: 'Test User',
        files: [
          {
            originalName: 'first.pdf',
            mimeType: 'application/pdf',
            sizeBytes: 50,
            buffer: Buffer.from('first'),
          },
        ],
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      await createUseCase.execute({
        caseId: testCase.id,
        title: 'Second Delivery',
        description: 'Created second',
        category: 'Pruebas documentales',
        relatedPhase: 'Fase probatoria',
        createdByUserId: testUser.id,
        createdByName: 'Test User',
        files: [
          {
            originalName: 'second.pdf',
            mimeType: 'application/pdf',
            sizeBytes: 60,
            buffer: Buffer.from('second'),
          },
        ],
      });

      const deliveries = await listUseCase.execute(testCase.id);

      expect(deliveries).toHaveLength(2);
      expect(deliveries[0].title).toBe('Second Delivery');
      expect(deliveries[1].title).toBe('First Delivery');
    });
  });
});
