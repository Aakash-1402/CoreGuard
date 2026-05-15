import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import type { RiskEvent } from '@/types';

interface EventRowProps {
  event: RiskEvent;
  isSelected: boolean;
  onClick: () => void;
}

export function EventRow({ event, isSelected, onClick }: EventRowProps) {
  return (
    <tr
      onClick={onClick}
      className={`cursor-pointer transition-colors border-b border-gray-100
                  ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
    >
      <td className="px-4 py-3">
        <Badge variant={event.severity}>{event.severity}</Badge>
      </td>
      <td className="px-4 py-3 text-sm font-medium text-gray-900">{event.supplier}</td>
      <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px] truncate" title={event.part_asset}>
        {event.part_asset}
      </td>
      <td className="px-4 py-3">
        <Badge variant={event.status}>{event.status}</Badge>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px] truncate" title={event.summary}>
        {event.summary}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {event.owner_name ?? <span className="text-gray-400 italic">Unassigned</span>}
      </td>
      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
        {formatDate(event.detected_at)}
      </td>
      <td className="px-4 py-3 text-sm text-gray-500">{event.source}</td>
    </tr>
  );
}