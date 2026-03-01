import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum AuthProviderType {
  LOCAL = 'LOCAL',
  OIDC = 'OIDC',
}

export enum AppUserRole {
  PLATFORM_ADMIN = 'PLATFORM_ADMIN',
  LEGAL_MANAGER = 'LEGAL_MANAGER',
  LEGAL_OPERATOR = 'LEGAL_OPERATOR',
  LEGAL_REVIEWER = 'LEGAL_REVIEWER',
  LEGAL_VIEWER = 'LEGAL_VIEWER',
}

@Entity('app_users')
export class AppUser {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  fullName!: string;

  @Column()
  roleTitle!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ select: false })
  passwordHash!: string;

  @Column({ type: 'varchar', default: AuthProviderType.LOCAL })
  authProvider!: AuthProviderType;

  @Column({ type: 'varchar', default: AppUserRole.LEGAL_OPERATOR })
  roleKey!: AppUserRole;

  @Column({ default: false })
  isAdmin!: boolean;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ type: 'varchar', nullable: true })
  externalSubject?: string | null;

  @Column({ type: 'varchar', nullable: true })
  externalIssuer?: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
