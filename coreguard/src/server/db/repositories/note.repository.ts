import { BaseRepository } from './base.repository';
import type { Note } from '@/types';

export class NoteRepository extends BaseRepository<Note> {
  async create(eventId: string, authorId: string, content: string): Promise<Note> {
    const rows = await this.queryRows<Note>(
      `INSERT INTO notes (event_id, author_id, content) VALUES ($1, $2, $3) RETURNING *`,
      [eventId, authorId, content],
    );
    return rows[0]!;
  }

  async findByEventId(eventId: string): Promise<Note[]> {
    return this.queryRows(
      `SELECT n.*, u.name as author_name FROM notes n
       JOIN users u ON n.author_id = u.id WHERE n.event_id = $1 ORDER BY n.created_at ASC`,
      [eventId],
    );
  }
}