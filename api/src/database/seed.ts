import { DataSource } from 'typeorm';

import { createDatabaseOptions } from './database-options';
import {
  AuditActionType,
  AuditEntityType,
  AuditEvent,
} from '../modules/audit/domain/audit-event.entity';
import { hashPassword } from '../modules/auth/application/password-hash';
import {
  CaseAssignment,
  CaseAccessLevel,
} from '../modules/cases/domain/case-assignment.entity';
import { CaseFile } from '../modules/cases/domain/case-file.entity';
import { CaseStatus } from '../modules/cases/domain/case-status.enum';
import {
  ActivityType,
  CaseActivity,
} from '../modules/activity/domain/case-activity.entity';
import { DocumentDeliveryOrmEntity } from '../modules/documents/adapters/database/entities/document-delivery.orm-entity';
import { DocumentOrmEntity } from '../modules/documents/adapters/database/entities/document.orm-entity';
import { CaseNote } from '../modules/notes/domain/case-note.entity';
import { CaseParty } from '../modules/parties/domain/case-party.entity';
import {
  AppUser,
  AppUserRole,
  AuthProviderType,
} from '../modules/users/domain/app-user.entity';

interface SeedSummary {
  caseId: string;
  deliveryCount: number;
  documentCount: number;
}

async function seed() {
  const dataSource = new DataSource(
    createDatabaseOptions({
      url:
        process.env.DATABASE_URL ||
        'postgresql://postgres:postgres@localhost:5432/lexio',
      synchronize: false,
      migrationsRun: true,
      logging: true,
    }),
  );

  await dataSource.initialize();
  console.log('Database connected');

  const seedPassword = hashPassword(
    process.env.LEXIO_SEED_PASSWORD || 'LexioDemo2026!',
  );
  const summary: SeedSummary = {
    caseId: '',
    deliveryCount: 0,
    documentCount: 0,
  };

  await dataSource.transaction(async (manager) => {
    const caseRepo = manager.getRepository(CaseFile);
    const deliveryRepo = manager.getRepository(DocumentDeliveryOrmEntity);
    const docRepo = manager.getRepository(DocumentOrmEntity);
    const noteRepo = manager.getRepository(CaseNote);
    const activityRepo = manager.getRepository(CaseActivity);
    const auditRepo = manager.getRepository(AuditEvent);
    const partyRepo = manager.getRepository(CaseParty);
    const assignmentRepo = manager.getRepository(CaseAssignment);
    const userRepo = manager.getRepository(AppUser);

    await manager.query(
      'TRUNCATE TABLE audit_events, password_reset_tokens, user_sessions, case_activities, case_notes, case_parties, documents, document_batches, case_assignments, case_files, app_users CASCADE',
    );

    const currentUser = await userRepo.save(
      userRepo.create({
        fullName: 'Dr. Carlos Mendoza',
        roleTitle: 'Abogado Senior',
        email: 'carlos.mendoza@lexio.local',
        passwordHash: seedPassword,
        authProvider: AuthProviderType.LOCAL,
        roleKey: AppUserRole.PLATFORM_ADMIN,
        isAdmin: true,
        isActive: true,
        externalSubject: null,
        externalIssuer: null,
      }),
    );

    const secondUser = await userRepo.save(
      userRepo.create({
        fullName: 'Lic. Ana Ramírez',
        roleTitle: 'Asociada Procesal',
        email: 'ana.ramirez@lexio.local',
        passwordHash: seedPassword,
        authProvider: AuthProviderType.LOCAL,
        roleKey: AppUserRole.LEGAL_OPERATOR,
        isAdmin: false,
        isActive: true,
        externalSubject: null,
        externalIssuer: null,
      }),
    );

    const viewerUser = await userRepo.save(
      userRepo.create({
        fullName: 'Dra. Sofía Ortiz',
        roleTitle: 'Consulta externa',
        email: 'sofia.ortiz@lexio.local',
        passwordHash: seedPassword,
        authProvider: AuthProviderType.LOCAL,
        roleKey: AppUserRole.LEGAL_VIEWER,
        isAdmin: false,
        isActive: true,
        externalSubject: null,
        externalIssuer: null,
      }),
    );

    const savedCase = await caseRepo.save(
      caseRepo.create({
        caseNumber: 'EXP-2026-001',
        clientName: 'María González Rodríguez',
        status: CaseStatus.ACTIVE,
        stage: 'Fase probatoria',
        responsibleUserName: 'Dr. Carlos Mendoza',
        caseType: 'Civil · Arrendamiento',
        courtName: 'Juzgado 3.º Civil del Distrito Judicial',
        opposingPartyName: 'Inmobiliaria Horizonte S.A. de C.V.',
        nextAction: 'Preparar escrito de ofrecimiento de pruebas y validar anexos',
        nextHearingDate: new Date('2026-03-15T10:00:00'),
      }),
    );
    summary.caseId = savedCase.id;
    console.log(`Created case: ${savedCase.caseNumber} (${savedCase.id})`);

    const savedAssignments = await assignmentRepo.save([
      assignmentRepo.create({
        caseId: savedCase.id,
        userId: currentUser.id,
        accessLevel: CaseAccessLevel.OWNER,
        assignedByUserId: currentUser.id,
      }),
      assignmentRepo.create({
        caseId: savedCase.id,
        userId: secondUser.id,
        accessLevel: CaseAccessLevel.EDITOR,
        assignedByUserId: currentUser.id,
      }),
      assignmentRepo.create({
        caseId: savedCase.id,
        userId: viewerUser.id,
        accessLevel: CaseAccessLevel.VIEWER,
        assignedByUserId: currentUser.id,
      }),
    ]);

    const delivery1 = await deliveryRepo.save(
      deliveryRepo.create({
        caseId: savedCase.id,
        case: savedCase,
        title: 'Poder Notarial',
        description:
          'Documentos de representación legal otorgados por la cliente para actuar en su nombre ante el tribunal.',
        category: 'Poderes y representación',
        relatedPhase: 'Inicio del asunto',
        createdByUserId: currentUser.id,
        createdByUser: currentUser,
        createdByName: currentUser.fullName,
      }),
    );

    await docRepo.save([
      docRepo.create({
        deliveryId: delivery1.id,
        delivery: delivery1,
        originalName: 'poder_notarial_001.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 1258291,
        storageKey: `${savedCase.id}/${delivery1.id}/poder_notarial_001.pdf`,
      }),
      docRepo.create({
        deliveryId: delivery1.id,
        delivery: delivery1,
        originalName: 'anexo_identificacion.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 524288,
        storageKey: `${savedCase.id}/${delivery1.id}/anexo_identificacion.pdf`,
      }),
      docRepo.create({
        deliveryId: delivery1.id,
        delivery: delivery1,
        originalName: 'firma_autenticada.png',
        mimeType: 'image/png',
        sizeBytes: 204800,
        storageKey: `${savedCase.id}/${delivery1.id}/firma_autenticada.png`,
      }),
    ]);
    console.log(`Created delivery: "${delivery1.title}" with 3 documents`);

    const delivery2 = await deliveryRepo.save(
      deliveryRepo.create({
        caseId: savedCase.id,
        case: savedCase,
        title: 'Demanda Inicial',
        description:
          'Escrito de demanda presentado ante el juzgado con todos los anexos probatorios requeridos.',
        category: 'Demanda y contestación',
        relatedPhase: 'Demanda',
        createdByUserId: secondUser.id,
        createdByUser: secondUser,
        createdByName: secondUser.fullName,
      }),
    );

    await docRepo.save([
      docRepo.create({
        deliveryId: delivery2.id,
        delivery: delivery2,
        originalName: 'escrito_demanda_principal.docx',
        mimeType:
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        sizeBytes: 2097152,
        storageKey: `${savedCase.id}/${delivery2.id}/escrito_demanda_principal.docx`,
      }),
      docRepo.create({
        deliveryId: delivery2.id,
        delivery: delivery2,
        originalName: 'constancia_recepcion.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 153600,
        storageKey: `${savedCase.id}/${delivery2.id}/constancia_recepcion.pdf`,
      }),
    ]);
    console.log(`Created delivery: "${delivery2.title}" with 2 documents`);

    const delivery3 = await deliveryRepo.save(
      deliveryRepo.create({
        caseId: savedCase.id,
        case: savedCase,
        title: 'Pruebas Documentales',
        description:
          'Evidencia documental recopilada durante la investigación preliminar del caso.',
        category: 'Pruebas documentales',
        relatedPhase: 'Fase probatoria',
        createdByUserId: currentUser.id,
        createdByUser: currentUser,
        createdByName: currentUser.fullName,
      }),
    );

    await docRepo.save([
      docRepo.create({
        deliveryId: delivery3.id,
        delivery: delivery3,
        originalName: 'contrato_arrendamiento.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 3145728,
        storageKey: `${savedCase.id}/${delivery3.id}/contrato_arrendamiento.pdf`,
      }),
      docRepo.create({
        deliveryId: delivery3.id,
        delivery: delivery3,
        originalName: 'estados_cuenta_2025.xlsx',
        mimeType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        sizeBytes: 1048576,
        storageKey: `${savedCase.id}/${delivery3.id}/estados_cuenta_2025.xlsx`,
      }),
      docRepo.create({
        deliveryId: delivery3.id,
        delivery: delivery3,
        originalName: 'correspondencia_notarial.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 716800,
        storageKey: `${savedCase.id}/${delivery3.id}/correspondencia_notarial.pdf`,
      }),
      docRepo.create({
        deliveryId: delivery3.id,
        delivery: delivery3,
        originalName: 'fotografias_evidencia.zip',
        mimeType: 'application/zip',
        sizeBytes: 5242880,
        storageKey: `${savedCase.id}/${delivery3.id}/fotografias_evidencia.zip`,
      }),
    ]);
    console.log(`Created delivery: "${delivery3.title}" with 4 documents`);

    summary.deliveryCount = 3;
    summary.documentCount = 9;

    await noteRepo.save([
      noteRepo.create({
        caseId: savedCase.id,
        content:
          'La contraparte respondió de forma parcial. Confirmar si falta anexar la certificación del contrato original antes de la audiencia.',
        authorName: secondUser.fullName,
        authorUserId: secondUser.id,
        isPinned: true,
      }),
      noteRepo.create({
        caseId: savedCase.id,
        content:
          'La cliente confirmó disponibilidad para firmar el escrito complementario el próximo lunes por la mañana.',
        authorName: currentUser.fullName,
        authorUserId: currentUser.id,
        isPinned: false,
      }),
    ]);

    await partyRepo.save([
      partyRepo.create({
        caseId: savedCase.id,
        role: 'Cliente',
        name: savedCase.clientName,
        detail: 'Parte representada en el procedimiento civil de arrendamiento.',
        sortOrder: 10,
      }),
      partyRepo.create({
        caseId: savedCase.id,
        role: 'Contraparte',
        name: savedCase.opposingPartyName || 'Contraparte pendiente de registro',
        detail: 'Parte demandada con incidencia directa en la estrategia probatoria.',
        sortOrder: 20,
      }),
      partyRepo.create({
        caseId: savedCase.id,
        role: 'Tribunal',
        name: savedCase.courtName || 'Tribunal pendiente de registro',
        detail: `Conduce la ${savedCase.stage?.toLowerCase() || 'tramitación'} y resolverá las promociones pendientes.`,
        sortOrder: 30,
      }),
      partyRepo.create({
        caseId: savedCase.id,
        role: 'Responsable del expediente',
        name: savedCase.responsibleUserName || 'Responsable pendiente de asignación',
        detail: savedCase.nextAction || 'Sin próximo paso registrado.',
        sortOrder: 40,
      }),
    ]);

    await activityRepo.save([
      activityRepo.create({
        caseId: savedCase.id,
        type: ActivityType.UPLOAD,
        description: 'Registró la entrega "Pruebas Documentales".',
        authorName: currentUser.fullName,
      }),
      activityRepo.create({
        caseId: savedCase.id,
        type: ActivityType.NOTE,
        description: 'Agregó observaciones estratégicas sobre la audiencia próxima.',
        authorName: secondUser.fullName,
      }),
      activityRepo.create({
        caseId: savedCase.id,
        type: ActivityType.STATUS_CHANGE,
        description: 'Actualizó el expediente a fase probatoria.',
        authorName: currentUser.fullName,
      }),
      activityRepo.create({
        caseId: savedCase.id,
        type: ActivityType.PARTY_ADDED,
        description: 'Registró la contraparte y confirmó el tribunal competente.',
        authorName: 'Sistema Lexio',
      }),
    ]);

    await auditRepo.save([
      auditRepo.create({
        actionType: AuditActionType.USER_CREATED,
        entityType: AuditEntityType.USER,
        entityId: currentUser.id,
        targetUserId: currentUser.id,
        actorUserId: currentUser.id,
        actorName: currentUser.fullName,
        summary: `${currentUser.fullName} creó la cuenta ${currentUser.email}.`,
        metadata: {
          email: currentUser.email,
          roleKey: currentUser.roleKey,
        },
      }),
      auditRepo.create({
        actionType: AuditActionType.USER_CREATED,
        entityType: AuditEntityType.USER,
        entityId: secondUser.id,
        targetUserId: secondUser.id,
        actorUserId: currentUser.id,
        actorName: currentUser.fullName,
        summary: `${currentUser.fullName} creó la cuenta ${secondUser.email}.`,
        metadata: {
          email: secondUser.email,
          roleKey: secondUser.roleKey,
        },
      }),
      auditRepo.create({
        actionType: AuditActionType.USER_CREATED,
        entityType: AuditEntityType.USER,
        entityId: viewerUser.id,
        targetUserId: viewerUser.id,
        actorUserId: currentUser.id,
        actorName: currentUser.fullName,
        summary: `${currentUser.fullName} creó la cuenta ${viewerUser.email}.`,
        metadata: {
          email: viewerUser.email,
          roleKey: viewerUser.roleKey,
        },
      }),
      auditRepo.create({
        actionType: AuditActionType.CASE_ASSIGNMENT_CREATED,
        entityType: AuditEntityType.CASE_ASSIGNMENT,
        entityId: savedAssignments[1]?.id || savedCase.id,
        caseId: savedCase.id,
        targetUserId: secondUser.id,
        actorUserId: currentUser.id,
        actorName: currentUser.fullName,
        summary: `${currentUser.fullName} asignó ${secondUser.fullName} al expediente ${savedCase.caseNumber}.`,
        metadata: {
          caseNumber: savedCase.caseNumber,
          accessLevel: CaseAccessLevel.EDITOR,
        },
      }),
      auditRepo.create({
        actionType: AuditActionType.CASE_ASSIGNMENT_CREATED,
        entityType: AuditEntityType.CASE_ASSIGNMENT,
        entityId: savedAssignments[2]?.id || savedCase.id,
        caseId: savedCase.id,
        targetUserId: viewerUser.id,
        actorUserId: currentUser.id,
        actorName: currentUser.fullName,
        summary: `${currentUser.fullName} asignó ${viewerUser.fullName} al expediente ${savedCase.caseNumber}.`,
        metadata: {
          caseNumber: savedCase.caseNumber,
          accessLevel: CaseAccessLevel.VIEWER,
        },
      }),
    ]);
  });

  console.log('\nSeed completed successfully.');
  console.log(`   Case ID: ${summary.caseId}`);
  console.log(`   Total deliveries: ${summary.deliveryCount}`);
  console.log(`   Total documents: ${summary.documentCount}`);

  await dataSource.destroy();
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
