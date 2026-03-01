import { MigrationInterface, QueryRunner } from 'typeorm';

import { hashPassword } from '../../modules/auth/application/password-hash';

export class AddAuthSessionAndDocumentAuthor20260227230000
  implements MigrationInterface
{
  name = 'AddAuthSessionAndDocumentAuthor20260227230000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "app_users" ADD COLUMN IF NOT EXISTS "passwordHash" character varying',
    );
    await queryRunner.query(
      `ALTER TABLE "app_users" ADD COLUMN IF NOT EXISTS "authProvider" character varying NOT NULL DEFAULT 'LOCAL'`,
    );
    await queryRunner.query(
      'ALTER TABLE "app_users" ADD COLUMN IF NOT EXISTS "isAdmin" boolean NOT NULL DEFAULT false',
    );
    await queryRunner.query(
      'ALTER TABLE "app_users" ADD COLUMN IF NOT EXISTS "isActive" boolean NOT NULL DEFAULT true',
    );

    const bootstrapPassword =
      process.env.LEXIO_BOOTSTRAP_PASSWORD || 'LexioDemo2026!';
    const bootstrapHash = hashPassword(bootstrapPassword);
    await queryRunner.query(
      'UPDATE "app_users" SET "passwordHash" = $1 WHERE "passwordHash" IS NULL OR "passwordHash" = \'\'',
      [bootstrapHash],
    );
    await queryRunner.query(
      'ALTER TABLE "app_users" ALTER COLUMN "passwordHash" SET NOT NULL',
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_sessions" (
        "id" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "sessionToken" character varying NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_sessions_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_user_sessions_sessionToken" UNIQUE ("sessionToken"),
        CONSTRAINT "FK_user_sessions_userId" FOREIGN KEY ("userId") REFERENCES "app_users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_user_sessions_userId" ON "user_sessions" ("userId")',
    );

    await queryRunner.query(
      'ALTER TABLE "document_batches" ADD COLUMN IF NOT EXISTS "createdByUserId" uuid',
    );
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'FK_document_batches_createdByUserId'
        ) THEN
          ALTER TABLE "document_batches"
          ADD CONSTRAINT "FK_document_batches_createdByUserId"
          FOREIGN KEY ("createdByUserId") REFERENCES "app_users"("id") ON DELETE SET NULL;
        END IF;
      END
      $$;
    `);
    await queryRunner.query(`
      UPDATE "document_batches" AS batch
      SET "createdByUserId" = user_match."id"
      FROM "app_users" AS user_match
      WHERE batch."createdByUserId" IS NULL
        AND batch."createdByName" = user_match."fullName"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_user_sessions_userId"',
    );
    await queryRunner.query('DROP TABLE IF EXISTS "user_sessions"');
    await queryRunner.query(
      'ALTER TABLE "document_batches" DROP CONSTRAINT IF EXISTS "FK_document_batches_createdByUserId"',
    );
    await queryRunner.query(
      'ALTER TABLE "document_batches" DROP COLUMN IF EXISTS "createdByUserId"',
    );
    await queryRunner.query(
      'ALTER TABLE "app_users" DROP COLUMN IF EXISTS "passwordHash"',
    );
    await queryRunner.query(
      'ALTER TABLE "app_users" DROP COLUMN IF EXISTS "authProvider"',
    );
    await queryRunner.query(
      'ALTER TABLE "app_users" DROP COLUMN IF EXISTS "isAdmin"',
    );
    await queryRunner.query(
      'ALTER TABLE "app_users" DROP COLUMN IF EXISTS "isActive"',
    );
  }
}
