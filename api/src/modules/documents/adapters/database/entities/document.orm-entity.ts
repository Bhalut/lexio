import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Document } from '../../../domain/models/document.model';
import { DocumentDeliveryOrmEntity } from './document-delivery.orm-entity';

@Entity('documents')
export class DocumentOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'batchId' })
  deliveryId!: string;

  @ManyToOne(() => DocumentDeliveryOrmEntity, (delivery) => delivery.documents, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'batchId' })
  delivery!: DocumentDeliveryOrmEntity;

  @Column()
  originalName!: string;

  @Column()
  mimeType!: string;

  @Column({ type: 'bigint' })
  sizeBytes!: number;

  @Column()
  storageKey!: string;

  @Column({ nullable: true })
  checksum?: string;

  @CreateDateColumn()
  uploadedAt!: Date;

  static toDomain(ormEntity: DocumentOrmEntity): Document {
    return new Document(
      ormEntity.id,
      ormEntity.deliveryId,
      ormEntity.originalName,
      ormEntity.mimeType,
      Number(ormEntity.sizeBytes),
      ormEntity.storageKey,
      ormEntity.checksum ?? null,
      ormEntity.uploadedAt,
    );
  }

  static fromDomain(domainModel: Document): DocumentOrmEntity {
    const ormEntity = new DocumentOrmEntity();
    ormEntity.id = domainModel.id;
    ormEntity.deliveryId = domainModel.deliveryId;
    ormEntity.originalName = domainModel.originalName;
    ormEntity.mimeType = domainModel.mimeType;
    ormEntity.sizeBytes = domainModel.sizeBytes;
    ormEntity.storageKey = domainModel.storageKey;
    ormEntity.checksum = domainModel.checksum || '';
    ormEntity.uploadedAt = domainModel.uploadedAt;
    return ormEntity;
  }
}
