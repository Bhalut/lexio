import { randomUUID } from 'crypto';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCaseAssignments20260228020000 implements MigrationInterface {
  name = 'AddCaseAssignments20260228020000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "case_assignments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "caseId" uuid NOT NULL,
        "userId" uuid NOT NULL,
        "accessLevel" character varying NOT NULL DEFAULT 'VIEWER',
        "assignedByUserId" uuid,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_case_assignments_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_case_assignments_caseId_userId" UNIQUE ("caseId", "userId"),
        CONSTRAINT "FK_case_assignments_caseId" FOREIGN KEY ("caseId") REFERENCES "case_files"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_case_assignments_userId" FOREIGN KEY ("userId") REFERENCES "app_users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_case_assignments_assignedByUserId" FOREIGN KEY ("assignedByUserId") REFERENCES "app_users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_case_assignments_caseId" ON "case_assignments" ("caseId")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_case_assignments_userId" ON "case_assignments" ("userId")',
    );

    const adminUsers = (await queryRunner.query(`
      SELECT "id"
      FROM "app_users"
      WHERE "roleKey" = 'PLATFORM_ADMIN' OR "isAdmin" = true
    `)) as Array<{ id: string }>;

    const caseFiles = (await queryRunner.query(`
      SELECT "id"
      FROM "case_files"
    `)) as Array<{ id: string }>;

    for (const adminUser of adminUsers) {
      for (const caseFile of caseFiles) {
        const existing = (await queryRunner.query(
          `
            SELECT 1
            FROM "case_assignments"
            WHERE "caseId" = $1 AND "userId" = $2
            LIMIT 1
          `,
          [caseFile.id, adminUser.id],
        )) as Array<{ '?column?': number }>;

        if (existing.length > 0) {
          continue;
        }

        await queryRunner.query(
          `
            INSERT INTO "case_assignments" (
              "id",
              "caseId",
              "userId",
              "accessLevel",
              "assignedByUserId"
            ) VALUES ($1, $2, $3, $4, $5)
          `,
          [
            randomUUID(),
            caseFile.id,
            adminUser.id,
            'OWNER',
            adminUser.id,
          ],
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_case_assignments_userId"',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS "IDX_case_assignments_caseId"',
    );
    await queryRunner.query('DROP TABLE IF EXISTS "case_assignments"');
  }
}
