'use client';
import { Card, CardContent } from '@/components/ui/Card';
import { useEvents } from '@/hooks/useEvents';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';

export function SummaryCards() {
  const { meta: allMeta } = useEvents({ limit: 1 });
  const { meta: openMeta } = useEvents({ status: 'new', limit: 1 });
  const { meta: reviewedMeta } = useEvents({ status: 'reviewed', limit: 1 });
  const { meta: escalatedMeta } = useEvents({ status: 'escalated', limit: 1 });
  const { meta: ignoredMeta } = useEvents({ status: 'ignored', limit: 1 });
  const { meta: resolvedMeta } = useEvents({ status: 'resolved', limit: 1 });

  const openCount = (openMeta.total || 0) + (reviewedMeta.total || 0) + (escalatedMeta.total || 0) + (ignoredMeta.total || 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="text-center">
          <p className="text-2xl font-bold text-red-600">{allMeta.total || '—'}</p>
          <p className="text-xs text-gray-500 uppercase mt-1">Total Events</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="text-center">
          <p className="text-2xl font-bold text-orange-600">{openCount || '—'}</p>
          <p className="text-xs text-gray-500 uppercase mt-1">Open</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="text-center">
          <p className="text-2xl font-bold text-green-600">{resolvedMeta.total || '—'}</p>
          <p className="text-xs text-gray-500 uppercase mt-1">Resolved</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="text-center">
          <p className="text-2xl font-bold text-blue-600">{allMeta.totalPages || '—'}</p>
          <p className="text-xs text-gray-500 uppercase mt-1">Pages</p>
        </CardContent>
      </Card>
    </div>
  );
}