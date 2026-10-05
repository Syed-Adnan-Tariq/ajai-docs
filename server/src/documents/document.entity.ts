import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

export type ShareRole = 'editor' | 'viewer';
export type DocRole = 'owner' | ShareRole;

@Entity('documents')
export class DocumentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: 'Untitled document' })
  title: string;

  /** Sanitized HTML produced by the Tiptap editor. */
  @Column({ type: 'text', default: '' })
  content: string;

  @Index()
  @Column()
  ownerId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @OneToMany(() => DocumentShare, (s) => s.document)
  shares: DocumentShare[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('document_shares')
@Unique(['documentId', 'userId'])
export class DocumentShare {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  documentId: string;

  @ManyToOne(() => DocumentEntity, (d) => d.shares, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'documentId' })
  document: DocumentEntity;

  @Index()
  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'varchar', default: 'editor' })
  role: ShareRole;

  @CreateDateColumn()
  createdAt: Date;
}
