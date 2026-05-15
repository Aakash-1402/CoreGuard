import { AuthService } from '@/server/services/auth.service';
import { ForbiddenError, UnauthorizedError } from '@/lib/errors';
import { Session } from 'next-auth';

function makeSession(role: string): Session {
  return {
    user: { id: 'user-1', name: 'Test', email: 'test@test.com', role },
    expires: new Date(Date.now() + 3600000).toISOString(),
  } as unknown as Session;
}

describe('Auth service — role boundary', () => {
  it('throws UnauthorizedError when session is null', () => {
    expect(() => AuthService.requireRole(null, 'operator'))
      .toThrow(UnauthorizedError);
  });

  it('allows operator for operator-required action', () => {
    expect(() => AuthService.requireRole(makeSession('operator'), 'operator'))
      .not.toThrow();
  });

  it('allows manager for manager-required action', () => {
    expect(() => AuthService.requireRole(makeSession('manager'), 'manager'))
      .not.toThrow();
  });

  it('REJECTS operator for manager-required action (resolve boundary)', () => {
    expect(() => AuthService.requireRole(makeSession('operator'), 'manager'))
      .toThrow(ForbiddenError);

    try {
      AuthService.requireRole(makeSession('operator'), 'manager');
    } catch (e) {
      expect(e).toBeInstanceOf(ForbiddenError);
      expect((e as ForbiddenError).statusCode).toBe(403);
      expect((e as ForbiddenError).code).toBe('FORBIDDEN');
    }
  });

  it('hasRole returns correct values', () => {
    expect(AuthService.hasRole(makeSession('operator'), 'operator')).toBe(true);
    expect(AuthService.hasRole(makeSession('operator'), 'manager')).toBe(false);
    expect(AuthService.hasRole(makeSession('manager'), 'manager')).toBe(true);
    expect(AuthService.hasRole(null, 'operator')).toBe(false);
  });
});