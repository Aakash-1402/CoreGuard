'use client';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import type { RiskEvent } from '@/types';

interface EventDetailPanelProps {
  event: RiskEvent;
}

export function EventDetailPanel({ event }: EventDetailPanelProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant={event.severity}>{event.severity}</Badge>
            <Badge variant={event.status}>{event.status}</Badge>
          </div>
          <h2 className="text-lg font-semibold text-gray-900">{event.summary}</h2>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-4">
        <MetadataItem label="Supplier" value={event.supplier} />
        <MetadataItem label="Part/Asset" value={event.part_asset} />
        <MetadataItem label="Source" value={event.source} />
        <MetadataItem label="Owner" value={event.owner_name ?? 'Unassigned'} />
        <MetadataItem label="Detected" value={formatDate(event.detected_at)} />
        <MetadataItem label="Last Updated" value={formatDate(event.updated_at)} />
      </div>

      {event.recommended_action && (
        <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200">
          <p className="text-xs text-blue-600 font-medium uppercase mb-1">Recommended Action</p>
          <p className="text-sm text-blue-800">{event.recommended_action}</p>
        </div>
      )}

      {event.resolved_at && (
        <div className="mt-3 p-3 bg-green-50 rounded-md border border-green-200">
          <p className="text-xs text-green-600 font-medium uppercase mb-1">Resolved At</p>
          <p className="text-sm text-green-800">{formatDate(event.resolved_at)}</p>
        </div>
      )}
    </div>
  );
}

function MetadataItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500 uppercase font-medium">{label}</p>
      <p className="text-sm text-gray-900 mt-0.5">{value}</p>
    </div>
  );
}