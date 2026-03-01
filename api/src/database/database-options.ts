import { join } from 'path';
import { DataSourceOptions } from 'typeorm';

import { CaseActivity } from '../modules/activity/domain/case-activity.entity';
import { AuditEvent } from '../modules/audit/domain/audit-event.entity';
import { PasswordResetToken } from '../modules/auth/domain/password-reset-token.entity';
import { CaseAssignment } from '../modules/cases/domain/case-assignment.entity';
import { UserSession } from '../modules/auth/domain/user-session.entity';
import { CaseFile } from '../modules/cases/domain/case-file.entity';
import { DocumentDeliveryOrmEntity } from '../modules/documents/adapters/database/entities/document-delivery.orm-entity';
import { DocumentOrmEntity } from '../modules/documents/adapters/database/entities/document.orm-entity';
import { CaseNote } from '../modules/notes/domain/case-note.entity';
import { CaseParty } from '../modules/parties/domain/case-party.entity';
import { AppUser } from '../modules/users/domain/app-user.entity';

export function createDatabaseOptions(options: {
  url?: string;
  synchronize?: boolean;
  migrationsRun?: boolean;
  logging?: boolean;
}): DataSourceOptions {
  return {
    type: 'postgres',
    url: options.url,
    entities: [
      CaseFile,
      CaseAssignment,
      DocumentDeliveryOrmEntity,
      DocumentOrmEntity,
      CaseNote,
      CaseActivity,
      AuditEvent,
      CaseParty,
      UserSession,
      PasswordResetToken,
      AppUser,
    ],
    migrations: [join(process.cwd(), 'api/src/database/migrations/*{.ts,.js}')],
    migrationsTableName: 'typeorm_migrations',
    synchronize: options.synchronize ?? false,
    migrationsRun: options.migrationsRun ?? false,
    logging: options.logging ?? false,
  };
}
