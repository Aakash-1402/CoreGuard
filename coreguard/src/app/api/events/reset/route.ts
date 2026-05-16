export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { ApiResponse } from '@/lib/api-response';
import { AppError } from '@/lib/errors';
import { EventRepository } from '@/server/db/repositories/event.repository';

const eventRepo = new EventRepository();

export async function POST(_req: NextRequest) {
  try {
    const count = await eventRepo.resetRandomToNew();
    return ApiResponse.success({ count, message: `${count} events reset to 'new'` });
  } catch (error) {
    if (error instanceof AppError) return ApiResponse.error(error);
    return ApiResponse.internalError(error);
  }
}
