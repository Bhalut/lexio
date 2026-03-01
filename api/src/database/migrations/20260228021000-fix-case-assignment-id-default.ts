import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixCaseAssignmentIdDefault20260228021000
  implements MigrationInterface
{
  name = 'FixCaseAssignmentIdDefault20260228021000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await queryRunner.query(
      'ALTER TABLE "case_assignments" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "case_assignments" ALTER COLUMN "id" DROP DEFAULT',
    );
  }
}
