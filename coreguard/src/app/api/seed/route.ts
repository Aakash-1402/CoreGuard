import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse } from '@/lib/api-response';
import { AppError } from '@/lib/errors';
import { SeedService } from '@/server/services/seed.service';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    if (process.env.ALLOW_SEED !== 'true') {
      return new NextResponse(null, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const shouldReset = searchParams.get('reset') === 'true';

    const seedService = new SeedService();
    if (shouldReset) {
      await seedService.reset();
    } else {
      await seedService.seed();
    }

    return ApiResponse.success({ message: shouldReset ? 'Database reset and seeded' : 'Database seeded' });
  } catch (error) {
    if (error instanceof AppError) return ApiResponse.error(error);
    return ApiResponse.internalError(error);
  }
}