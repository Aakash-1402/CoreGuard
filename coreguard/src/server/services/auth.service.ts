import { Session } from 'next-auth';
import { ForbiddenError, UnauthorizedError } from '@/lib/errors';
import type { UserRole } from '@/types';

export class AuthService {
  static requireRole(session: Session | null, ...roles: UserRole[]): void {
    if (!session?.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const userRole = (session.user as Record<string, unknown>).role as UserRole | undefined;

    if (!userRole || !roles.includes(userRole)) {
      throw new ForbiddenError(
        `This action requires one of: ${roles.join(', ')}. Your role: ${userRole ?? 'none'}`
      );
    }
  }

  static hasRole(session: Session | null, role: UserRole): boolean {
    if (!session?.user) return false;
    return (session.user as Record<string, unknown>).role === role;
  }

  static getRole(session: Session | null): UserRole | null {
    if (!session?.user) return null;
    return ((session.user as Record<string, unknown>).role as UserRole) ?? null;
  }
}