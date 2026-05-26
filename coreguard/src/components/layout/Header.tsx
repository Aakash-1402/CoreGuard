'use client';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';

export function Header() {
  const { user, role, isManager } = useAuth();

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <h2 className="text-base font-semibold text-gray-900">Risk Events</h2>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium
          ${isManager ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
          {role}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600">{user?.name ?? user?.email}</span>
        <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/login` })}>
          Sign out
        </Button>
      </div>
    </header>
  );
}