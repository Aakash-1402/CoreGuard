import { z } from 'zod';
import { ValidationError } from '@/lib/errors';
import { SEVERITIES, EVENT_STATUSES, ALLOWED_SORT_COLUMNS, ALLOWED_SORT_ORDERS } from '@/lib/constants';

const statusUpdateSchema = z.object({
  status: z.enum(EVENT_STATUSES as unknown as [string, ...string[]]),
});

const ownerUpdateSchema = z.object({
  owner_id: z.string().uuid('Invalid owner ID'),
});

const filterQuerySchema = z.object({
  severity: z.enum(SEVERITIES as unknown as [string, ...string[]]).optional(),
  status: z.enum(EVENT_STATUSES as unknown as [string, ...string[]]).optional(),
  owner: z.string().uuid().optional(),
  source: z.string().optional(),
  search: z.string().max(200).optional(),
  sort: z.string().optional(),
  order: z.enum(ALLOWED_SORT_ORDERS as unknown as [string, ...string[]]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export class EventValidator {
  static validateStatusUpdate(body: unknown): z.infer<typeof statusUpdateSchema> {
    const result = statusUpdateSchema.safeParse(body);
    if (!result.success) {
      throw new ValidationError('Invalid status update', result.error.flatten());
    }
    return result.data;
  }

  static validateOwnerUpdate(body: unknown): z.infer<typeof ownerUpdateSchema> {
    const result = ownerUpdateSchema.safeParse(body);
    if (!result.success) {
      throw new ValidationError('Invalid owner update', result.error.flatten());
    }
    return result.data;
  }

  static validateFilters(query: Record<string, string | string[] | undefined>) {
    const result = filterQuerySchema.safeParse(query);
    if (!result.success) {
      throw new ValidationError('Invalid filter parameters', result.error.flatten());
    }
    return result.data;
  }

  static validateSort(sort: string | undefined): string {
    if (!sort) return 'detected_at';
    const lower = sort.toLowerCase();
    if (!(ALLOWED_SORT_COLUMNS as readonly string[]).includes(lower)) {
      throw new ValidationError(`Invalid sort column: ${sort}`);
    }
    return lower;
  }

  static validateOrder(order: string | undefined): 'asc' | 'desc' {
    if (!order || !(ALLOWED_SORT_ORDERS as readonly string[]).includes(order)) {
      return 'desc';
    }
    return order as 'asc' | 'desc';
  }
}