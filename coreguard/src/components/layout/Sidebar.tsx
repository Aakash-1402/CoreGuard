'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/events', label: 'Risk Events', icon: '!' },
  { href: '/dashboard', label: 'Dashboard', icon: '#' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 bg-gray-900 text-white min-h-screen fixed left-0 top-0 flex flex-col">
      <div className="px-5 py-4 border-b border-gray-800">
        <h1 className="text-lg font-bold tracking-tight">CoreGuard</h1>
        <p className="text-xs text-gray-400">Risk Review Console</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors
                          ${isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
            >
              <span className="w-6 h-6 flex items-center justify-center text-xs font-bold bg-gray-700 rounded">
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-5 py-3 border-t border-gray-800 text-xs text-gray-500">
        v0.1.0
      </div>
    </aside>
  );
}