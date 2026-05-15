'use client';
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { EmptyState } from '@/components/ui/EmptyState';
import { EventRow } from './EventRow';
import { EventFilters } from './EventFilters';
import { useEvents } from '@/hooks/useEvents';
import { useFilters } from '@/hooks/useFilters';
import { usePolling } from '@/hooks/usePolling';
import { useRouter } from 'next/navigation';
import type { EventFilters as EventFiltersType } from '@/types';
import { POLL_INTERVAL_MS } from '@/lib/constants';

const SORTABLE_HEADERS: { key: string; label: string }[] = [
  { key: 'detected_at', label: 'Time' },
  { key: 'severity', label: 'Severity' },
];

export function EventTable() {
  const router = useRouter();
  const { filters, setFilter, clearFilters } = useFilters();
  const { events, meta, isLoading, error, refresh } = useEvents(filters);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { poll, isPolling } = usePolling(
    useCallback(() => { refresh(); }, [refresh]),
    POLL_INTERVAL_MS,
  );

  const handleFilterChange = useCallback(
    (key: keyof EventFiltersType, value: string | undefined) => setFilter(key, value),
    [setFilter],
  );

  const handleSort = useCallback((key: string) => {
    if (filters.sort === key) {
      setFilter('order', filters.order === 'asc' ? 'desc' : 'asc');
    } else {
      setFilter('sort', key);
      setFilter('order', 'desc');
    }
  }, [filters, setFilter]);

  const handleRowClick = useCallback((eventId: string) => {
    setSelectedId(eventId);
    router.push(`/events/${eventId}`);
  }, [router]);

  if (isLoading) return <Spinner className="py-16" />;
  if (error) return <ErrorBanner message="Failed to load events" onRetry={refresh} />;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <EventFilters filters={filters} onFilterChange={handleFilterChange} onClear={clearFilters} />
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {meta.total} event{meta.total !== 1 ? 's' : ''}
          </span>
          <Button variant="secondary" size="sm" onClick={poll} disabled={isPolling}>
            {isPolling ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {events.length === 0 ? (
        <EmptyState title="No events found" description="Try adjusting your filters." />
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {SORTABLE_HEADERS.map((h) => (
                    <th key={h.key} className="px-4 py-3 text-left">
                      <button
                        onClick={() => handleSort(h.key)}
                        className="text-xs font-semibold text-gray-600 uppercase tracking-wider hover:text-gray-900"
                      >
                        {h.label}{filters.sort === h.key ? (filters.order === 'asc' ? ' ↑' : ' ↓') : ''}
                      </button>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Supplier</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Part/Asset</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Summary</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Owner</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Detected</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Source</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <EventRow
                    key={event.id}
                    event={event}
                    isSelected={selectedId === event.id}
                    onClick={() => handleRowClick(event.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <span className="text-xs text-gray-500">
              Page {meta.page} of {meta.totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary" size="sm"
                disabled={meta.page <= 1}
                onClick={() => setFilter('page', String(meta.page - 1))}
              >
                Previous
              </Button>
              <Button
                variant="secondary" size="sm"
                disabled={meta.page >= meta.totalPages}
                onClick={() => setFilter('page', String(meta.page + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}