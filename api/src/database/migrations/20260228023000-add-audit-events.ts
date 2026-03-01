import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuditEvents20260228023000 implements MigrationInterface {
  name = 'AddAuditEvents20260228023000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "audit_events" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "actionType" character varying NOT NULL,
        "entityType" character varying NOT NULL,
        "entityId" uuid NOT NULL,
        "caseId" uuid,
        "targetUserId" uuid,
        "actorUserId" uuid,
        "actorName" character varying,
        "correlationId" character varying,
        "summary" text NOT NULL,
        "metadata" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_audit_events_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_audit_events_actionType" ON "audit_events" ("actionType")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_audit_events_entityType" ON "audit_events" ("entityType")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_audit_events_caseId" ON "audit_events" ("caseId")',
    );
    await queryRunner.query(
      'CREATE INDEX IF NOT EXISTS "IDX_audit_events_targetUserId" ON "audit_events" ("targetUserId")',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_audit_events_targetUserId"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_audit_events_caseId"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_audit_events_entityType"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_audit_events_actionType"');
    await queryRunner.query('DROP TABLE IF EXISTS "audit_events"');
  }
}
