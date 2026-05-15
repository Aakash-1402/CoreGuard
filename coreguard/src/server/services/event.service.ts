import { createLogger } from '@/lib/logger';
import { ValidationError } from '@/lib/errors';
import { ALLOWED_TRANSITIONS } from '@/lib/constants';
import type { RiskEvent, EventFilters, EventDetail, EventStatus, PaginatedResponse } from '@/types';
import { EventRepository } from '@/server/db/repositories/event.repository';
import { AuditRepository } from '@/server/db/repositories/audit.repository';
import { NoteRepository } from '@/server/db/repositories/note.repository';
import { EvidenceRepository } from '@/server/db/repositories/evidence.repository';
import { AuthService } from './auth.service';
import { Session } from 'next-auth';

const logger = createLogger('EventService');

export class EventService {
  constructor(
    private readonly eventRepo: EventRepository,
    private readonly auditRepo: AuditRepository,
    private readonly noteRepo: NoteRepository,
    private readonly evidenceRepo: EvidenceRepository,
  ) {}

  async listEvents(filters: EventFilters): Promise<PaginatedResponse<RiskEvent>> {
    return this.eventRepo.listEvents(filters);
  }

  async getEventDetail(eventId: string): Promise<EventDetail | null> {
    const [event, notes, evidence, auditLog] = await Promise.all([
      this.eventRepo.findById(eventId),
      this.noteRepo.findByEventId(eventId),
      this.evidenceRepo.findByEventId(eventId),
      this.auditRepo.findByEventId(eventId),
    ]);
    if (!event) return null;
    return { event, notes, evidence, auditLog };
  }

  async transitionStatus(eventId: string, newStatus: EventStatus, session: Session): Promise<void> {
    const current = await this.eventRepo.findById(eventId);
    if (!current) throw new ValidationError(`Event ${eventId} not found`);

    if (newStatus === 'resolved') {
      AuthService.requireRole(session, 'manager');
    }

    const allowed = ALLOWED_TRANSITIONS[current.status] ?? [];
    if (!allowed.includes(newStatus)) {
      throw new ValidationError(`Cannot transition from ${current.status} to ${newStatus}`);
    }

    await this.eventRepo.updateStatus(eventId, newStatus);
    await this.auditRepo.insertEntry(
      eventId, session.user!.id!, 'status_changed',
      'status', current.status, newStatus,
    );
  }

  async assignOwner(eventId: string, newOwnerId: string, session: Session): Promise<void> {
    const current = await this.eventRepo.findById(eventId);
    if (!current) throw new ValidationError(`Event ${eventId} not found`);

    await this.eventRepo.assignOwner(eventId, newOwnerId);
    await this.auditRepo.insertEntry(
      eventId, session.user!.id!, 'owner_assigned',
      'owner_id', current.owner_id ?? null, newOwnerId,
    );
  }

  async addNote(eventId: string, authorId: string, content: string): Promise<void> {
    const event = await this.eventRepo.findById(eventId);
    if (!event) throw new ValidationError(`Event ${eventId} not found`);

    await this.noteRepo.create(eventId, authorId, content);
    await this.auditRepo.insertEntry(eventId, authorId, 'note_added', null, null, null);
  }
}