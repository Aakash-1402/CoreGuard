import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { ConsoleShell } from '@/components/layout/ConsoleShell';

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  return <ConsoleShell>{children}</ConsoleShell>;
}