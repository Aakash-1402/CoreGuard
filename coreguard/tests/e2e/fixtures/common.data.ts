import type { Severity, EventStatus, Source } from '@/types';

export const USERS = {
  alice: {
    email: 'alice@coreguard.dev',
    name: 'Alice (operator)',
    role: 'operator' as const,
    buttonLabel: 'Alice (operator)',
  },
  bob: {
    email: 'bob@coreguard.dev',
    name: 'Bob (operator)',
    role: 'operator' as const,
    buttonLabel: 'Bob (operator)',
  },
  carol: {
    email: 'carol@coreguard.dev',
    name: 'Carol (manager)',
    role: 'manager' as const,
    buttonLabel: 'Carol (manager)',
  },
  dan: {
    email: 'dan@coreguard.dev',
    name: 'Dan (manager)',
    role: 'manager' as const,
    buttonLabel: 'Dan (manager)',
  },
} as const;

export const SEVERITIES: Severity[] = ['critical', 'high', 'medium', 'low'];

export const EVENT_STATUSES: EventStatus[] = ['new', 'reviewed', 'escalated', 'ignored', 'resolved'];

export const SOURCES: Source[] = ['sap', 'oracle', 'salesforce', 'manual', 'api', 'monitoring'];

export const SUPPLIERS = [
  'Acme Corp', 'GlobalParts Inc', 'TechSupply Ltd', 'IndustrialCo',
  'MegaComponents', 'PrecisionParts GmbH', 'Eastern Manufacturing',
  'Northern Supplies', 'Delta Components', 'Omega Industries',
];

export const PARTS = [
  'Bearing Assembly XJ-200', 'Control Unit V3', 'Hydraulic Pump HP-50',
  'Sensor Module SM-100', 'Valve Assembly VA-75', 'Power Supply PS-300',
  'Circuit Board CB-88', 'Cooling Fan CF-12', 'Drive Motor DM-40',
  'Pressure Regulator PR-22', 'Temperature Sensor TS-15', 'Flow Meter FM-8',
];

export const NOTE_CONTENT = 'E2E test note — automated verification';

export const SEARCH_TERMS = {
  supplier: 'Acme',
  part: 'Bearing',
  nonexistent: 'zzz_no_match_xyz',
};

export const URLS = {
  login: '/login',
  events: '/events',
  dashboard: '/dashboard',
} as const;

export const STATUS_TRANSITIONS: Record<EventStatus, EventStatus[]> = {
  new: ['reviewed', 'escalated', 'ignored'],
  reviewed: ['resolved', 'ignored'],
  escalated: ['resolved', 'ignored'],
  ignored: ['resolved', 'new'],
  resolved: [],
};

export const ACTION_LABELS: Record<EventStatus, string> = {
  reviewed: 'Review',
  escalated: 'Escalate',
  ignored: 'Ignore',
  new: 'Reopen',
  resolved: 'Resolve',
};
