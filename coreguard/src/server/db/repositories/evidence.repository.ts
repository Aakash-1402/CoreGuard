import { BaseRepository } from './base.repository';
import type { Evidence } from '@/types';

export class EvidenceRepository extends BaseRepository<Evidence> {
  async findByEventId(eventId: string): Promise<Evidence[]> {
    return this.queryRows(
      `SELECT ev.*, u.name as added_by_name FROM evidence ev
       JOIN users u ON ev.added_by = u.id WHERE ev.event_id = $1::uuid ORDER BY ev.created_at ASC`,
      [eventId],
    );
  }
}