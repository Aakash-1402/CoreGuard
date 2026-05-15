'use client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { SEVERITIES, EVENT_STATUSES, SOURCES } from '@/lib/constants';
import type { EventFilters } from '@/types';

interface EventFiltersProps {
  filters: EventFilters;
  onFilterChange: (key: keyof EventFilters, value: string | undefined) => void;
  onClear: () => void;
}

const severityOptions = SEVERITIES.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }));
const statusOptions = EVENT_STATUSES.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }));
const sourceOptions = SOURCES.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }));

export function EventFilters({ filters, onFilterChange, onClear }: EventFiltersProps) {
  const hasActiveFilters = filters.severity || filters.status || filters.source || filters.search;

  return (
    <div className="flex flex-wrap items-end gap-3 mb-4">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500 font-medium">Severity</label>
        <Select
          value={filters.severity ?? ''}
          onChange={(v) => onFilterChange('severity', v || undefined)}
          options={severityOptions}
          placeholder="All"
          className="w-32"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500 font-medium">Status</label>
        <Select
          value={filters.status ?? ''}
          onChange={(v) => onFilterChange('status', v || undefined)}
          options={statusOptions}
          placeholder="All"
          className="w-32"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500 font-medium">Source</label>
        <Select
          value={filters.source ?? ''}
          onChange={(v) => onFilterChange('source', v || undefined)}
          options={sourceOptions}
          placeholder="All"
          className="w-32"
        />
      </div>

      <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
        <label className="text-xs text-gray-500 font-medium">Search</label>
        <Input
          placeholder="Search supplier, part, summary..."
          value={filters.search ?? ''}
          onChange={(e) => onFilterChange('search', e.target.value || undefined)}
          className="w-full"
        />
      </div>

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onClear}>
          Clear filters
        </Button>
      )}
    </div>
  );
}