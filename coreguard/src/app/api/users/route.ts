export const runtime = 'nodejs';

import { auth } from '@/auth';
import { ApiResponse } from '@/lib/api-response';
import { AppError } from '@/lib/errors';
import { AuthService } from '@/server/services/auth.service';
import { UserRepository } from '@/server/db/repositories/user.repository';

const userRepo = new UserRepository();

export async function GET() {
  try {
    const session = await auth();
    AuthService.requireRole(session, 'operator');

    const users = await userRepo.findAll();
    const safe = users.map((u) => ({ id: u.id, name: u.name, role: u.role }));
    return ApiResponse.success(safe);
  } catch (error) {
    if (error instanceof AppError) return ApiResponse.error(error);
    return ApiResponse.internalError(error);
  }
}