'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { ErrorBanner } from '@/components/ui/ErrorBanner';

const MOCK_USERS = [
  { email: 'alice@coreguard.dev', name: 'Alice (operator)' },
  { email: 'bob@coreguard.dev', name: 'Bob (operator)' },
  { email: 'carol@coreguard.dev', name: 'Carol (manager)' },
  { email: 'dan@coreguard.dev', name: 'Dan (manager)' },
];

export function LoginForm() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (email: string) => {
    setLoading(email);
    setError('');
    try {
      const result = await signIn('credentials', {
        email,
        password: 'password',
        redirect: false,
      });
      if (result?.error) {
        setError(result.error);
      } else {
        router.push('/events');
        router.refresh();
      }
    } catch {
      setError('Login failed');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">CoreGuard</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to the Risk Review Console</p>
        </div>

        {error && <ErrorBanner message={error} />}

        <div className="space-y-3 mt-4">
          {MOCK_USERS.map((user) => (
            <Button
              key={user.email}
              variant={user.name.includes('manager') ? 'primary' : 'secondary'}
              className="w-full"
              onClick={() => handleLogin(user.email)}
              disabled={loading !== null}
            >
              {loading === user.email ? 'Signing in...' : user.name}
            </Button>
          ))}
        </div>

        <p className="text-xs text-gray-400 text-center mt-6">
          Mock authentication — any password accepted
        </p>
      </div>
    </div>
  );
}