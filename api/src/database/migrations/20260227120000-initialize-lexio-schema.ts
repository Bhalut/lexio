import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitializeLexioSchema20260227120000
  implements MigrationInterface
{
  name = 'InitializeLexioSchema20260227120000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'case_files_status_enum'
        ) THEN
          CREATE TYPE "case_files_status_enum" AS ENUM (
            'ACTIVE',
            'CLOSED',
            'PENDING',
            'ARCHIVED'
          );
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_type WHERE typname = 'case_activities_type_enum'
        ) THEN
          CREATE TYPE "case_activities_type_enum" AS ENUM (
            'UPLOAD',
            'NOTE',
            'STATUS_CHANGE',
            'PARTY_ADDED',
            'PARTY_UPDATED',
            'PARTY_REMOVED',
            'SYSTEM'
          );
        END IF;
      END
      $$;
    `);

    await queryRunner.query(
      'ALTER TYPE "case_activities_type_enum" ADD VALUE IF NOT EXISTS \'PARTY_UPDATED\'',
    );
    await queryRunner.query(
      'ALTER TYPE "case_activities_type_enum" ADD VALUE IF NOT EXISTS \'PARTY_REMOVED\'',
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "app_users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "fullName" character varying NOT NULL,
        "roleTitle" character varying NOT NULL,
        "email" character varying NOT NULL,
        "passwordHash" character varying NOT NULL,
        "authProvider" character varying NOT NULL DEFAULT 'LOCAL',
        "isAdmin" boolean NOT NULL DEFAULT false,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_app_users_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_app_users_email" UNIQUE ("email")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "case_files" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "caseNumber" character varying NOT NULL,
        "clientName" character varying NOT NULL,
        "status" "case_files_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "stage" character varying,
        "responsibleUserName" character varying,
        "caseType" character varying,
        "courtName" character varying,
        "opposingPartyName" character varying,
        "nextAction" character varying,
        "nextHearingDate" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_case_files_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_case_files_caseNumber" UNIQUE ("caseNumber")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "document_batches" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "caseId" uuid NOT NULL,
        "title" character varying NOT NULL,
        "description" text NOT NULL,
        "category" character varying NOT NULL,
        "relatedPhase" character varying NOT NULL,
        "createdByUserId" uuid,
        "createdByName" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_document_batches_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "documents" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "batchId" uuid NOT NULL,
        "originalName" character varying NOT NULL,
        "mimeType" character varying NOT NULL,
        "sizeBytes" bigint NOT NULL,
        "storageKey" character varying NOT NULL,
        "checksum" character varying,
        "uploadedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_documents_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "case_notes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "caseId" uuid NOT NULL,
        "content" text NOT NULL,
        "authorName" character varying NOT NULL,
        "authorUserId" uuid,
        "authorAvatar" character varying,
        "isPinned" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_case_notes_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "case_activities" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "caseId" uuid NOT NULL,
        "type" "case_activities_type_enum" NOT NULL,
        "description" text NOT NULL,
        "metadata" character varying,
        "authorName" character varying NOT NULL,
        "authorAvatar" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_case_activities_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "case_parties" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "caseId" uuid NOT NULL,
        "role" character varying NOT NULL,
        "name" character varying NOT NULL,
        "detail" text,
        "sortOrder" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_case_parties_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_sessions" (
        "id" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "sessionToken" character varying NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_sessions_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_user_sessions_sessionToken" UNIQUE ("sessionToken")
      )
    `);

    await queryRunner.query(
      'ALTER TABLE "case_files" ADD COLUMN IF NOT EXISTS "caseType" character varying',
    );
    await queryRunner.query(
      'ALTER TABLE "case_files" ADD COLUMN IF NOT EXISTS "courtName" character varying',
    );
    await queryRunner.query(
      'ALTER TABLE "case_files" ADD COLUMN IF NOT EXISTS "opposingPartyName" character varying',
    );
    await queryRunner.query(
      'ALTER TABLE "case_files" ADD COLUMN IF NOT EXISTS "nextAction" character varying',
    );
    await queryRunner.query(
      'ALTER TABLE "document_batches" ADD COLUMN IF NOT EXISTS "category" character varying',
    );
    await queryRunner.query(
      'ALTER TABLE "document_batches" ADD COLUMN IF NOT EXISTS "relatedPhase" character varying',
    );
    await queryRunner.query(
      'ALTER TABLE "document_batches" ADD COLUMN IF NOT EXISTS "createdByUserId" uuid',
    );
    await queryRunner.query(
      'ALTER TABLE "case_notes" ADD COLUMN IF NOT EXISTS "authorUserId" uuid',
    );

    await queryRunner.query(`
      UPDATE "document_batches"
      SET "category" = COALESCE(NULLIF("category", ''), 'Sin clasificar')
      WHERE "category" IS NULL OR "category" = ''
    `);
    await queryRunner.query(`
      UPDATE "document_batches"
      SET "relatedPhase" = COALESCE(NULLIF("relatedPhase", ''), 'Fase no especificada')
      WHERE "relatedPhase" IS NULL OR "relatedPhase" = ''
    `);
    await queryRunner.query(
      'ALTER TABLE "document_batches" ALTER COLUMN "category" SET NOT NULL',
    );
    await queryRunner.query(
      'ALTER TABLE "document_batches" ALTER COLUMN "relatedPhase" SET NOT NULL',
    );

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_document_batches_caseId'
        ) THEN
          ALTER TABLE "document_batches"
          ADD CONSTRAINT "FK_document_batches_caseId"
          FOREIGN KEY ("caseId") REFERENCES "case_files"("id") ON DELETE CASCADE;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_document_batches_createdByUserId'
        ) THEN
          ALTER TABLE "document_batches"
          ADD CONSTRAINT "FK_document_batches_createdByUserId"
          FOREIGN KEY ("createdByUserId") REFERENCES "app_users"("id") ON DELETE SET NULL;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_documents_batchId'
        ) THEN
          ALTER TABLE "documents"
          ADD CONSTRAINT "FK_documents_batchId"
          FOREIGN KEY ("batchId") REFERENCES "document_batches"("id") ON DELETE CASCADE;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_case_notes_caseId'
        ) THEN
          ALTER TABLE "case_notes"
          ADD CONSTRAINT "FK_case_notes_caseId"
          FOREIGN KEY ("caseId") REFERENCES "case_files"("id") ON DELETE CASCADE;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_case_notes_authorUserId'
        ) THEN
          ALTER TABLE "case_notes"
          ADD CONSTRAINT "FK_case_notes_authorUserId"
          FOREIGN KEY ("authorUserId") REFERENCES "app_users"("id") ON DELETE SET NULL;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_case_activities_caseId'
        ) THEN
          ALTER TABLE "case_activities"
          ADD CONSTRAINT "FK_case_activities_caseId"
          FOREIGN KEY ("caseId") REFERENCES "case_files"("id") ON DELETE CASCADE;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_case_parties_caseId'
        ) THEN
          ALTER TABLE "case_parties"
          ADD CONSTRAINT "FK_case_parties_caseId"
          FOREIGN KEY ("caseId") REFERENCES "case_files"("id") ON DELETE CASCADE;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_user_sessions_userId'
        ) THEN
          ALTER TABLE "user_sessions"
          ADD CONSTRAINT "FK_user_sessions_userId"
          FOREIGN KEY ("userId") REFERENCES "app_users"("id") ON DELETE CASCADE;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_user_sessions_userId" ON "user_sessions" ("userId")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_user_sessions_userId"');
    await queryRunner.query('DROP TABLE IF EXISTS "user_sessions"');
    await queryRunner.query('DROP TABLE IF EXISTS "case_parties"');
    await queryRunner.query('DROP TABLE IF EXISTS "case_activities"');
    await queryRunner.query('DROP TABLE IF EXISTS "case_notes"');
    await queryRunner.query('DROP TABLE IF EXISTS "documents"');
    await queryRunner.query('DROP TABLE IF EXISTS "document_batches"');
    await queryRunner.query('DROP TABLE IF EXISTS "case_files"');
    await queryRunner.query('DROP TABLE IF EXISTS "app_users"');
    await queryRunner.query('DROP TYPE IF EXISTS "case_activities_type_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "case_files_status_enum"');
  }
}
