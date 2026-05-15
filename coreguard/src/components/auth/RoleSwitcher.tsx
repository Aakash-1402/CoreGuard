'use client';
import { useAuth } from '@/hooks/useAuth';

export function RoleSwitcher() {
  const { role } = useAuth();

  if (!role) return null;

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium
      ${role === 'manager' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
      {role}
    </span>
  );
}