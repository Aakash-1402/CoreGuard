'use client';
import { formatDate } from '@/lib/utils';
import type { Evidence } from '@/types';

interface EvidenceListProps {
  items: Evidence[];
}

const typeIcons: Record<string, string> = {
  document: 'D',
  link: 'L',
  screenshot: 'S',
};

export function EvidenceList({ items }: EvidenceListProps) {
  if (items.length === 0) {
    return <p className="text-sm text-gray-500 italic py-4">No evidence items.</p>;
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-md border border-gray-200">
          <span className="w-8 h-8 flex items-center justify-center bg-gray-300 rounded text-xs font-bold text-gray-600">
            {typeIcons[item.type] ?? '?'}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-800 font-medium truncate">
              {item.link ? (
                <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {item.title}
                </a>
              ) : (
                item.title
              )}
            </p>
            <p className="text-xs text-gray-400">
              {item.type} &middot; Added by {item.added_by_name ?? item.added_by}{' '}
              &middot; {formatDate(item.created_at)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}