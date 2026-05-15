import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { ApiResponse } from '@/lib/api-response';
import { AppError } from '@/lib/errors';
import { healthCheck } from '@/server/db/connection';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const session = await auth();
    const dbOk = await healthCheck();
    return ApiResponse.success({
      status: dbOk ? 'ok' : 'degraded',
      db: dbOk ? 'connected' : 'disconnected',
      user: session?.user?.email ?? null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof AppError) return ApiResponse.error(error);
    return ApiResponse.internalError(error);
  }
}