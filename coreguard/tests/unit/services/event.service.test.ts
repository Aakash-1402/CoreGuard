import { ALLOWED_TRANSITIONS } from '@/lib/constants';
import type { EventStatus } from '@/types';

const validTransitions: [string, string][] = [
  ['new', 'reviewed'],
  ['new', 'escalated'],
  ['new', 'ignored'],
  ['reviewed', 'resolved'],
  ['escalated', 'resolved'],
  ['ignored', 'resolved'],
  ['ignored', 'new'],
];

const invalidTransitions: [string, string][] = [
  ['new', 'new'],
  ['new', 'resolved'],
  ['resolved', 'new'],
  ['resolved', 'reviewed'],
  ['resolved', 'escalated'],
  ['resolved', 'resolved'],
];

const map = ALLOWED_TRANSITIONS as Record<string, EventStatus[]>;

describe('Event state transitions', () => {
  it.each(validTransitions)('allows transition from %s to %s', (from, to) => {
    const allowed = map[from] ?? [];
    expect(allowed).toContain(to);
  });

  it.each(invalidTransitions)('rejects transition from %s to %s', (from, to) => {
    const allowed = map[from] ?? [];
    expect(allowed).not.toContain(to);
  });

  it('terminates at resolved (no outgoing transitions)', () => {
    expect(map['resolved']).toEqual([]);
  });

  it('covers all defined statuses', () => {
    const statuses = Object.keys(ALLOWED_TRANSITIONS);
    expect(statuses).toContain('new');
    expect(statuses).toContain('reviewed');
    expect(statuses).toContain('escalated');
    expect(statuses).toContain('ignored');
    expect(statuses).toContain('resolved');
  });
});