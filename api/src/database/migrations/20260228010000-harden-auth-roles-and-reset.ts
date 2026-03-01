import { MigrationInterface, QueryRunner } from 'typeorm';

export class HardenAuthRolesAndReset20260228010000
  implements MigrationInterface
{
  name = 'HardenAuthRolesAndReset20260228010000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "app_users" ADD COLUMN IF NOT EXISTS "roleKey" character varying NOT NULL DEFAULT \'LEGAL_OPERATOR\'',
    );
    await queryRunner.query(
      'ALTER TABLE "app_users" ADD COLUMN IF NOT EXISTS "externalSubject" character varying',
    );
    await queryRunner.query(
      'ALTER TABLE "app_users" ADD COLUMN IF NOT EXISTS "externalIssuer" character varying',
    );
    await queryRunner.query(`
      UPDATE "app_users"
      SET "roleKey" = CASE
        WHEN "isAdmin" = true THEN 'PLATFORM_ADMIN'
        WHEN "roleKey" IS NULL OR "roleKey" = '' THEN 'LEGAL_OPERATOR'
        ELSE "roleKey"
      END
    `);

    await queryRunner.query(
      'ALTER TABLE "user_sessions" ADD COLUMN IF NOT EXISTS "idToken" text',
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "tokenHash" character varying NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        "usedAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_password_reset_tokens_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_password_reset_tokens_tokenHash" UNIQUE ("tokenHash"),
        CONSTRAINT "FK_password_reset_tokens_userId" FOREIGN KEY ("userId") REFERENCES "app_users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_password_reset_tokens_userId" ON "password_reset_tokens" ("userId")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_password_reset_tokens_expiresAt" ON "password_reset_tokens" ("expiresAt")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_password_reset_tokens_expiresAt"',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_password_reset_tokens_userId"',
    );
    await queryRunner.query('DROP TABLE IF EXISTS "password_reset_tokens"');
    await queryRunner.query(
      'ALTER TABLE "user_sessions" DROP COLUMN IF EXISTS "idToken"',
    );
    await queryRunner.query(
      'ALTER TABLE "app_users" DROP COLUMN IF EXISTS "externalIssuer"',
    );
    await queryRunner.query(
      'ALTER TABLE "app_users" DROP COLUMN IF EXISTS "externalSubject"',
    );
    await queryRunner.query(
      'ALTER TABLE "app_users" DROP COLUMN IF EXISTS "roleKey"',
    );
  }
}
