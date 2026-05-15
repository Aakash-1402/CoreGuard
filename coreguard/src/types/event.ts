import type { Note } from './note';
import type { Evidence } from './evidence';
import type { AuditEntry } from './audit';

export type EventStatus = 'new' | 'reviewed' | 'escalated' | 'ignored' | 'resolved';
export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type Source = string;

export interface RiskEvent {
  id: string;
  supplier: string;
  part_asset: string;
  severity: Severity;
  status: EventStatus;
  summary: string;
  detected_at: string;
  source: string;
  owner_id: string | null;
  owner_name?: string;
  recommended_action: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventFilters {
  severity?: string;
  status?: string;
  owner?: string;
  source?: string;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface EventDetail {
  event: RiskEvent;
  notes: Note[];
  evidence: Evidence[];
  auditLog: AuditEntry[];
}

export type TransitionMap = Record<EventStatus, EventStatus[]>;