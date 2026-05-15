export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { ApiResponse } from '@/lib/api-response';
import { AppError } from '@/lib/errors';
import { EventValidator } from '@/server/validators/event.validator';
import { EventRepository } from '@/server/db/repositories/event.repository';
import { AuditRepository } from '@/server/db/repositories/audit.repository';
import { NoteRepository } from '@/server/db/repositories/note.repository';
import { EvidenceRepository } from '@/server/db/repositories/evidence.repository';
import { EventService } from '@/server/services/event.service';
import type { EventFilters } from '@/types';

const eventRepo = new EventRepository();
const auditRepo = new AuditRepository();
const noteRepo = new NoteRepository();
const evidenceRepo = new EvidenceRepository();
const eventService = new EventService(eventRepo, auditRepo, noteRepo, evidenceRepo);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query: Record<string, string | undefined> = {};
    for (const [key, value] of searchParams.entries()) {
      query[key] = value;
    }

    const filters = EventValidator.validateFilters(query) as EventFilters;
    const result = await eventService.listEvents(filters);
    return ApiResponse.success(result.data, {
      page: result.meta.page,
      limit: result.meta.limit,
      total: result.meta.total,
      totalPages: result.meta.totalPages,
    });
  } catch (error) {
    if (error instanceof AppError) return ApiResponse.error(error);
    return ApiResponse.internalError(error);
  }
}