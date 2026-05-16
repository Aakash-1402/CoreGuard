import { BaseRepository } from './base.repository';
import type { RiskEvent, EventFilters, PaginatedResponse } from '@/types';
import { ALLOWED_SORT_COLUMNS, ALLOWED_SORT_ORDERS, MAX_PAGE_SIZE } from '@/lib/constants';

export class EventRepository extends BaseRepository<RiskEvent> {
  async listEvents(filters: EventFilters): Promise<PaginatedResponse<RiskEvent>> {
    const where: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (filters.severity) { where.push(`e.severity = $${idx++}::severity_enum`); params.push(filters.severity); }
    if (filters.status)   { where.push(`e.status = $${idx++}::event_status_enum`);   params.push(filters.status); }
    if (filters.owner)    { where.push(`e.owner_id = $${idx++}::uuid`); params.push(filters.owner); }
    if (filters.source)   { where.push(`e.source = $${idx++}::text`);   params.push(filters.source); }
    if (filters.search)   {
      where.push(`(e.supplier ILIKE $${idx}::text OR e.part_asset ILIKE $${idx}::text OR e.source ILIKE $${idx}::text OR e.summary ILIKE $${idx}::text)`);
      params.push(`%${filters.search}%`);
      idx++;
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
    const sortCol = ALLOWED_SORT_COLUMNS.includes(filters.sort as never) ? `e.${filters.sort}` : 'e.detected_at';
    const sortOrd = ALLOWED_SORT_ORDERS.includes(filters.order as never) ? filters.order!.toUpperCase() : 'DESC';
    const limit = Math.min(filters.limit ?? 20, MAX_PAGE_SIZE);
    const offset = ((filters.page ?? 1) - 1) * limit;

    const countResult = await this.queryRows<{ total: string }>(
      `SELECT COUNT(*) as total FROM events e ${whereClause}`, params,
    );
    const total = Number(countResult[0]?.total ?? 0);

    const data = await this.queryRows<RiskEvent>(
      `SELECT e.*, u.name as owner_name FROM events e LEFT JOIN users u ON e.owner_id = u.id
       ${whereClause} ORDER BY ${sortCol} ${sortOrd}, e.detected_at DESC LIMIT $${idx++} OFFSET $${idx++}`,
      [...params, limit, offset],
    );

    return { data, meta: { page: filters.page ?? 1, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findById(id: string): Promise<RiskEvent | null> {
    return this.queryOneRow(
      `SELECT e.*, u.name as owner_name FROM events e LEFT JOIN users u ON e.owner_id = u.id WHERE e.id = $1::uuid`, [id],
    );
  }

  async updateStatus(id: string, status: string): Promise<void> {
    await this.execute(
      `UPDATE events SET status = $1::event_status_enum, updated_at = now(),
       resolved_at = CASE WHEN $1::text = 'resolved' THEN now() ELSE resolved_at END
       WHERE id = $2::uuid`,
      [status, id],
    );
  }

  async assignOwner(id: string, ownerId: string): Promise<void> {
    await this.execute(`UPDATE events SET owner_id = $1::uuid, updated_at = now() WHERE id = $2::uuid`, [ownerId, id]);
  }

  async resetRandomToNew(): Promise<number> {
    const result = await this.queryRows<{ count: string }>(
      `WITH to_update AS (
         SELECT id FROM events WHERE status != 'new' ORDER BY random() LIMIT (SELECT CEIL(COUNT(*) * 0.5)::int FROM events WHERE status != 'new')
       )
       UPDATE events SET status = 'new'::event_status_enum, updated_at = now(), resolved_at = NULL
       WHERE id IN (SELECT id FROM to_update)
       RETURNING id`,
    );
    return result.length;
  }
}