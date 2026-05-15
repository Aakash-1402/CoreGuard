import { USERS, EVENT_STATUSES, ACTION_LABELS } from './common.data';

export const MANAGER_USER = USERS.carol;

export const MANAGER_ALT_USER = USERS.dan;

export const MANAGER_VISIBLE_ACTIONS: Record<string, string[]> = {
  new: ['Review', 'Escalate', 'Ignore'],
  reviewed: ['Resolve', 'Ignore'],
  escalated: ['Resolve', 'Ignore'],
  ignored: ['Resolve', 'Reopen'],
  resolved: [],
};

export const MANAGER_SCENARIO = {
  user: MANAGER_USER,
  canResolve: true,
  expectedActionsForNew: MANAGER_VISIBLE_ACTIONS.new,
  expectedActionsForReviewed: MANAGER_VISIBLE_ACTIONS.reviewed,
  expectedActionsForEscalated: MANAGER_VISIBLE_ACTIONS.escalated,
  expectedActionsForIgnored: MANAGER_VISIBLE_ACTIONS.ignored,
  expectedActionsForResolved: MANAGER_VISIBLE_ACTIONS.resolved,
} as const;
