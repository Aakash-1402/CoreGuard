'use client';
import { Card, CardContent } from '@/components/ui/Card';
import { useEvents } from '@/hooks/useEvents';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';

export function SummaryCards() {
  const { meta } = useEvents({ limit: DEFAULT_PAGE_SIZE });

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="text-center">
          <p className="text-2xl font-bold text-red-600">{meta.total || '—'}</p>
          <p className="text-xs text-gray-500 uppercase mt-1">Total Events</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="text-center">
          <p className="text-2xl font-bold text-orange-600">{meta.total || '—'}</p>
          <p className="text-xs text-gray-500 uppercase mt-1">Open</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="text-center">
          <p className="text-2xl font-bold text-green-600">{meta.total || '—'}</p>
          <p className="text-xs text-gray-500 uppercase mt-1">Resolved</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="text-center">
          <p className="text-2xl font-bold text-blue-600">{meta.totalPages || '—'}</p>
          <p className="text-xs text-gray-500 uppercase mt-1">Pages</p>
        </CardContent>
      </Card>
    </div>
  );
}