'use client';
import { useSession } from 'next-auth/react';
import type { UserRole } from '@/types';

export function useAuth() {
  const { data: session, status } = useSession();

  return {
    session,
    user: session?.user ?? null,
    role: (session?.user as Record<string, unknown> | undefined)?.role as UserRole | undefined,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
    isOperator: (session?.user as Record<string, unknown> | undefined)?.role === 'operator',
    isManager: (session?.user as Record<string, unknown> | undefined)?.role === 'manager',
  };
}