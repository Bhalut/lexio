import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { CaseFile } from '../../../../cases/domain/case-file.entity';
import { AppUser } from '../../../../users/domain/app-user.entity';
import { DocumentDelivery } from '../../../domain/models/document-delivery.model';
import { DocumentOrmEntity } from './document.orm-entity';

@Entity('document_batches')
export class DocumentDeliveryOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  caseId!: string;

  @ManyToOne(() => CaseFile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'caseId' })
  case!: CaseFile;

  @Column()
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column()
  category!: string;

  @Column()
  relatedPhase!: string;

  @Column({ nullable: true })
  createdByUserId?: string | null;

  @ManyToOne(() => AppUser, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'createdByUserId' })
  createdByUser?: AppUser | null;

  @Column({ nullable: true })
  createdByName?: string;

  @OneToMany(() => DocumentOrmEntity, (document) => document.delivery, {
    cascade: true,
    eager: true,
  })
  documents!: DocumentOrmEntity[];

  @CreateDateColumn()
  createdAt!: Date;

  static toDomain(ormEntity: DocumentDeliveryOrmEntity): DocumentDelivery {
    return new DocumentDelivery(
      ormEntity.id,
      ormEntity.caseId,
      ormEntity.title,
      ormEntity.description,
      ormEntity.category,
      ormEntity.relatedPhase,
      ormEntity.createdByUserId ?? null,
      ormEntity.createdByName ?? null,
      ormEntity.createdAt,
      (ormEntity.documents || []).map(DocumentOrmEntity.toDomain),
    );
  }

  static fromDomain(domainModel: DocumentDelivery): DocumentDeliveryOrmEntity {
    const ormEntity = new DocumentDeliveryOrmEntity();
    ormEntity.id = domainModel.id;
    ormEntity.caseId = domainModel.caseId;
    ormEntity.title = domainModel.title;
    ormEntity.description = domainModel.description;
    ormEntity.category = domainModel.category;
    ormEntity.relatedPhase = domainModel.relatedPhase;
    ormEntity.createdByUserId = domainModel.createdByUserId;
    ormEntity.createdByName = domainModel.createdByName || '';
    ormEntity.createdAt = domainModel.createdAt;
    ormEntity.documents = (domainModel.documents || []).map((document) => {
      const documentOrm = DocumentOrmEntity.fromDomain(document);
      documentOrm.delivery = ormEntity;
      return documentOrm;
    });
    return ormEntity;
  }
}
