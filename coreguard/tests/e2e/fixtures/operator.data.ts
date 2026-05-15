import { USERS, EVENT_STATUSES, ACTION_LABELS } from './common.data';

export const OPERATOR_USER = USERS.alice;

export const OPERATOR_ALT_USER = USERS.bob;

export const OPERATOR_VISIBLE_ACTIONS: Record<string, string[]> = {
  new: ['Review', 'Escalate', 'Ignore'],
  reviewed: ['Ignore'],
  escalated: ['Ignore'],
  ignored: ['Reopen'],
  resolved: [],
};

export const OPERATOR_SCENARIO = {
  user: OPERATOR_USER,
  canResolve: false,
  expectedActionsForNew: OPERATOR_VISIBLE_ACTIONS.new,
  expectedActionsForReviewed: OPERATOR_VISIBLE_ACTIONS.reviewed,
  expectedActionsForEscalated: OPERATOR_VISIBLE_ACTIONS.escalated,
  expectedActionsForIgnored: OPERATOR_VISIBLE_ACTIONS.ignored,
  expectedActionsForResolved: OPERATOR_VISIBLE_ACTIONS.resolved,
} as const;
