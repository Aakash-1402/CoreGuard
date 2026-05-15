export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { ApiResponse } from '@/lib/api-response';
import { AppError, NotFoundError, UnauthorizedError } from '@/lib/errors';
import { EventValidator, NoteValidator } from '@/server/validators';
import { EventRepository } from '@/server/db/repositories/event.repository';
import { AuditRepository } from '@/server/db/repositories/audit.repository';
import { NoteRepository } from '@/server/db/repositories/note.repository';
import { EvidenceRepository } from '@/server/db/repositories/evidence.repository';
import { EventService } from '@/server/services/event.service';

const eventRepo = new EventRepository();
const auditRepo = new AuditRepository();
const noteRepo = new NoteRepository();
const evidenceRepo = new EvidenceRepository();
const eventService = new EventService(eventRepo, auditRepo, noteRepo, evidenceRepo);

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const detail = await eventService.getEventDetail(id);
    if (!detail) throw new NotFoundError(`Event ${id} not found`);
    return ApiResponse.success(detail);
  } catch (error) {
    if (error instanceof AppError) return ApiResponse.error(error);
    return ApiResponse.internalError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user) throw new UnauthorizedError('Authentication required');

    const body = await req.json();

    if ('status' in body) {
      const validated = EventValidator.validateStatusUpdate(body);
      await eventService.transitionStatus(id, validated.status as never, session!);
      return ApiResponse.success({ message: `Status updated to ${validated.status}` });
    }

    if ('owner_id' in body) {
      const validated = EventValidator.validateOwnerUpdate(body);
      await eventService.assignOwner(id, validated.owner_id, session!);
      return ApiResponse.success({ message: 'Owner assigned' });
    }

    throw new AppError('VALIDATION_ERROR', 'Provide status or owner_id', 400);
  } catch (error) {
    if (error instanceof AppError) return ApiResponse.error(error);
    return ApiResponse.internalError(error);
  }
}