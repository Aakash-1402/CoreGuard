export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { ApiResponse } from '@/lib/api-response';
import { AppError } from '@/lib/errors';
import { AuthService } from '@/server/services/auth.service';
import { NoteValidator } from '@/server/validators/note.validator';
import { EventRepository } from '@/server/db/repositories/event.repository';
import { AuditRepository } from '@/server/db/repositories/audit.repository';
import { NoteRepository } from '@/server/db/repositories/note.repository';
import { EvidenceRepository } from '@/server/db/repositories/evidence.repository';
import { EventService } from '@/server/services/event.service';

const noteRepo = new NoteRepository();
const eventService = new EventService(
  new EventRepository(),
  new AuditRepository(),
  noteRepo,
  new EvidenceRepository(),
);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await auth();

    AuthService.requireRole(session, 'operator');

    const body = await req.json();
    const validated = NoteValidator.validateCreate(body);

    await eventService.addNote(id, session!.user!.id!, validated.content);
    return ApiResponse.success({ message: 'Note added' });
  } catch (error) {
    if (error instanceof AppError) return ApiResponse.error(error);
    return ApiResponse.internalError(error);
  }
}