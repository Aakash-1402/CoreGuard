'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { ALLOWED_TRANSITIONS } from '@/lib/constants';
import type { EventStatus } from '@/types';

interface EventActionsProps {
  currentStatus: EventStatus;
  onAction: (status: EventStatus) => Promise<void>;
  disabled?: boolean;
}

const ACTION_LABELS: Record<EventStatus, { label: string; variant: 'primary' | 'secondary' | 'danger' }> = {
  reviewed: { label: 'Review', variant: 'primary' },
  escalated: { label: 'Escalate', variant: 'danger' },
  ignored: { label: 'Ignore', variant: 'secondary' },
  new: { label: 'Reopen', variant: 'secondary' },
  resolved: { label: 'Resolve', variant: 'primary' },
};

export function EventActions({ currentStatus, onAction, disabled }: EventActionsProps) {
  const { isManager } = useAuth();
  const [acting, setActing] = useState(false);

  const handleAction = async (status: EventStatus) => {
    setActing(true);
    try {
      await onAction(status);
    } finally {
      setActing(false);
    }
  };

  const allowed = (ALLOWED_TRANSITIONS[currentStatus] ?? []) as EventStatus[];
  if (allowed.length === 0) return null;

  const visible = isManager ? allowed : allowed.filter((s) => s !== 'resolved');

  if (visible.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {visible.map((status) => {
        const meta = ACTION_LABELS[status];
        const isResolve = status === 'resolved';
        return (
          <Button
            key={status}
            variant={meta.variant}
            size="sm"
            disabled={disabled || acting}
            onClick={() => handleAction(status)}
            className={isResolve ? 'bg-green-600 hover:bg-green-700' : undefined}
          >
            {acting ? '...' : meta.label}
          </Button>
        );
      })}
    </div>
  );
}