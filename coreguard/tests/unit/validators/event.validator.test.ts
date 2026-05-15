import { EventValidator } from '@/server/validators/event.validator';
import { ValidationError } from '@/lib/errors';

describe('Event validator', () => {
  it('accepts valid status update', () => {
    const result = EventValidator.validateStatusUpdate({ status: 'reviewed' });
    expect(result.status).toBe('reviewed');
  });

  it('accepts valid owner update', () => {
    const result = EventValidator.validateOwnerUpdate({ owner_id: '550e8400-e29b-41d4-a716-446655440000' });
    expect(result.owner_id).toBe('550e8400-e29b-41d4-a716-446655440000');
  });

  it('rejects invalid status', () => {
    expect(() => EventValidator.validateStatusUpdate({ status: 'deleted' })).toThrow(ValidationError);
  });

  it('rejects non-uuid owner_id', () => {
    expect(() => EventValidator.validateOwnerUpdate({ owner_id: 'not-a-uuid' })).toThrow(ValidationError);
  });

  it('rejects empty status', () => {
    expect(() => EventValidator.validateStatusUpdate({})).toThrow(ValidationError);
  });

  it('validates sort column against allowlist', () => {
    expect(EventValidator.validateSort('detected_at')).toBe('detected_at');
    expect(() => EventValidator.validateSort('DROP TABLE--')).toThrow(ValidationError);
  });

  it('validates sort order', () => {
    expect(EventValidator.validateOrder('asc')).toBe('asc');
    expect(EventValidator.validateOrder('desc')).toBe('desc');
    expect(EventValidator.validateOrder(undefined)).toBe('desc');
  });
});