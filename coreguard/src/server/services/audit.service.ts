import { createLogger } from '@/lib/logger';
import { AuditRepository } from '@/server/db/repositories/audit.repository';

const logger = createLogger('AuditService');

export class AuditService {
  constructor(private readonly auditRepo: AuditRepository) {}

  async record(
    eventId: string, changedBy: string, action: string,
    fieldChanged: string | null, oldValue: string | null, newValue: string | null,
  ) {
    return this.auditRepo.insertEntry(eventId, changedBy, action, fieldChanged, oldValue, newValue);
  }

  async getTimeline(eventId: string) {
    return this.auditRepo.findByEventId(eventId);
  }
}