import { BaseRepository } from './base.repository';
import type { AuditEntry } from '@/types';

export class AuditRepository extends BaseRepository<AuditEntry> {
  async insertEntry(
    eventId: string, changedBy: string, action: string,
    fieldChanged: string | null, oldValue: string | null, newValue: string | null,
  ): Promise<AuditEntry> {
    const rows = await this.queryRows<AuditEntry>(
      `INSERT INTO audit_log (event_id, changed_by, action, field_changed, old_value, new_value)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [eventId, changedBy, action, fieldChanged, oldValue, newValue],
    );
    return rows[0]!;
  }

  async findByEventId(eventId: string): Promise<AuditEntry[]> {
    return this.queryRows(
      `SELECT al.*, u.name as changed_by_name FROM audit_log al
       JOIN users u ON al.changed_by = u.id WHERE al.event_id = $1 ORDER BY al.created_at ASC`,
      [eventId],
    );
  }
}