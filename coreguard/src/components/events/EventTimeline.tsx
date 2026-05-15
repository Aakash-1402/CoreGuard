'use client';
import { formatDate } from '@/lib/utils';
import type { AuditEntry } from '@/types';

interface EventTimelineProps {
  entries: AuditEntry[];
}

const actionLabels: Record<string, string> = {
  status_changed: 'Status changed',
  owner_assigned: 'Owner assigned',
  note_added: 'Note added',
};

export function EventTimeline({ entries }: EventTimelineProps) {
  if (entries.length === 0) {
    return <p className="text-sm text-gray-500 italic py-4">No audit history yet.</p>;
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <div key={entry.id} className="flex gap-3 text-sm">
          <div className="flex flex-col items-center">
            <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
            <div className="w-px flex-1 bg-gray-200" />
          </div>
          <div className="flex-1 pb-3">
            <p className="text-gray-900 font-medium">
              {actionLabels[entry.action] ?? entry.action}
            </p>
            {entry.field_changed && (
              <p className="text-gray-600 text-xs mt-0.5">
                {entry.field_changed}:{' '}
                <span className="text-gray-400 line-through">{entry.old_value ?? '—'}</span>
                {' → '}
                <span className="text-gray-800">{entry.new_value ?? '—'}</span>
              </p>
            )}
            <p className="text-gray-400 text-xs mt-1">
              {entry.changed_by_name ?? entry.changed_by}{' '}
              &middot; {formatDate(entry.created_at)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}