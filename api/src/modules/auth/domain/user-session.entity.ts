import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

import { AppUser } from '../../users/domain/app-user.entity';

@Entity('user_sessions')
export class UserSession {
  @PrimaryColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @ManyToOne(() => AppUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: AppUser;

  @Column({ unique: true })
  sessionToken!: string;

  @Column({ type: 'text', nullable: true })
  idToken?: string | null;

  @Column({ type: 'timestamp' })
  expiresAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
