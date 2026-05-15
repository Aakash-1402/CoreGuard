'use client';
import { SessionProvider } from 'next-auth/react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function ConsoleShell({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <div className="min-h-screen bg-gray-50">
        <div className="flex">
          <Sidebar />
          <div className="flex-1 ml-56">
            <Header />
            <main className="p-6">{children}</main>
          </div>
        </div>
      </div>
    </SessionProvider>
  );
}