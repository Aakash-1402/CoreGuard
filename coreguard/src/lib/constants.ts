import type { EventStatus, Severity, Source, UserRole, TransitionMap } from '@/types';

export const SEVERITIES: Severity[] = ['critical', 'high', 'medium', 'low'];

export const EVENT_STATUSES: EventStatus[] = ['new', 'reviewed', 'escalated', 'ignored', 'resolved'];

export const SOURCES: Source[] = ['sap', 'oracle', 'salesforce', 'manual', 'api', 'monitoring'];

export const USER_ROLES: UserRole[] = ['operator', 'manager'];

export const ALLOWED_TRANSITIONS: TransitionMap = {
  new: ['reviewed', 'escalated', 'ignored'],
  reviewed: ['resolved', 'ignored'],
  escalated: ['resolved', 'ignored'],
  ignored: ['resolved', 'new'],
  resolved: [],
};

export const ALLOWED_SORT_COLUMNS = [
  'detected_at', 'severity', 'status', 'created_at', 'supplier',
] as const;

export const ALLOWED_SORT_ORDERS = ['asc', 'desc'] as const;

export const DEFAULT_PAGE_SIZE = 20;

export const MAX_PAGE_SIZE = 100;

export const POLL_INTERVAL_MS = 30_000;