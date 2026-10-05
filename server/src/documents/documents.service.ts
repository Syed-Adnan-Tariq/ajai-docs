import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { DocRole, DocumentEntity, DocumentShare, ShareRole } from './document.entity';
import { sanitizeContent } from './sanitize';

const publicUser = (u: { id: string; name: string; email: string }) => ({
  id: u.id,
  name: u.name,
  email: u.email,
});

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(DocumentEntity) private readonly docs: Repository<DocumentEntity>,
    @InjectRepository(DocumentShare) private readonly shares: Repository<DocumentShare>,
    private readonly users: UsersService,
  ) {}

  // ---------- access control (single source of truth) ----------

  /**
   * Resolves the caller's role on a document. Documents the caller has no access to are
   * reported as 404 (not 403) so IDs can't be probed for existence.
   */
  private async loadWithRole(docId: string, userId: string) {
    const doc = await this.docs.findOne({ where: { id: docId }, relations: { owner: true } });
    if (!doc) throw new NotFoundException('Document not found');
    if (doc.ownerId === userId) return { doc, role: 'owner' as DocRole };
    const share = await this.shares.findOne({ where: { documentId: docId, userId } });
    if (!share) throw new NotFoundException('Document not found');
    return { doc, role: share.role as DocRole };
  }

  private requireOwner(role: DocRole) {
    if (role !== 'owner') throw new ForbiddenException('Only the owner can do this');
  }

  // ---------- documents ----------

  async create(userId: string, data: { title?: string; content?: string }) {
    const doc = await this.docs.save(
      this.docs.create({
        ownerId: userId,
        title: data.title?.trim() || 'Untitled document',
        content: data.content ?? '',
      }),
    );
    return { id: doc.id };
  }

  async list(userId: string) {
    const owned = await this.docs.find({
      where: { ownerId: userId },
      relations: { owner: true },
      order: { updatedAt: 'DESC' },
    });
    const sharedRows = await this.shares.find({
      where: { userId },
      relations: { document: { owner: true } },
    });

    const summary = (d: DocumentEntity, role: DocRole) => ({
      id: d.id,
      title: d.title,
      updatedAt: d.updatedAt,
      role,
      owner: publicUser(d.owner),
    });

    return {
      owned: owned.map((d) => summary(d, 'owner')),
      shared: sharedRows
        .map((s) => summary(s.document, s.role))
        .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt)),
    };
  }

  async get(docId: string, userId: string) {
    const { doc, role } = await this.loadWithRole(docId, userId);
    return {
      id: doc.id,
      title: doc.title,
      content: doc.content,
      updatedAt: doc.updatedAt,
      role,
      owner: publicUser(doc.owner),
    };
  }

  async update(docId: string, userId: string, patch: { title?: string; content?: string }) {
    const { doc, role } = await this.loadWithRole(docId, userId);
    if (role === 'viewer') throw new ForbiddenException('You have view-only access to this document');
    if (patch.title === undefined && patch.content === undefined) {
      throw new BadRequestException('Nothing to update');
    }
    // Only the owner may rename; editors may change content.
    if (patch.title !== undefined) {
      this.requireOwner(role);
      doc.title = patch.title.trim();
      if (!doc.title) throw new BadRequestException('Title cannot be empty');
    }
    if (patch.content !== undefined) doc.content = sanitizeContent(patch.content);
    const saved = await this.docs.save(doc);
    return { id: saved.id, title: saved.title, updatedAt: saved.updatedAt };
  }

  async remove(docId: string, userId: string) {
    const { doc, role } = await this.loadWithRole(docId, userId);
    this.requireOwner(role);
    await this.docs.remove(doc);
  }

  // ---------- sharing ----------

  async listShares(docId: string, userId: string) {
    const { role } = await this.loadWithRole(docId, userId);
    this.requireOwner(role);
    const rows = await this.shares.find({ where: { documentId: docId }, relations: { user: true } });
    return rows.map((s) => ({ userId: s.userId, role: s.role, user: publicUser(s.user) }));
  }

  async share(docId: string, ownerId: string, email: string, role: ShareRole) {
    const { doc, role: callerRole } = await this.loadWithRole(docId, ownerId);
    this.requireOwner(callerRole);

    const target = await this.users.findByEmail(email);
    if (!target) throw new NotFoundException('No user found with that email');
    if (target.id === doc.ownerId) throw new BadRequestException('You already own this document');

    const existing = await this.shares.findOne({ where: { documentId: docId, userId: target.id } });
    if (existing) {
      existing.role = role; // re-sharing updates the role
      await this.shares.save(existing);
    } else {
      await this.shares.save(this.shares.create({ documentId: docId, userId: target.id, role }));
    }
    return { userId: target.id, role, user: publicUser(target) };
  }

  async unshare(docId: string, ownerId: string, targetUserId: string) {
    const { role } = await this.loadWithRole(docId, ownerId);
    this.requireOwner(role);
    await this.shares.delete({ documentId: docId, userId: targetUserId });
  }
}
