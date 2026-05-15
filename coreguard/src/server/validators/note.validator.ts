import { z } from 'zod';
import { ValidationError } from '@/lib/errors';

const createNoteSchema = z.object({
  content: z.string().min(1, 'Note content is required').max(5000, 'Note too long'),
});

export class NoteValidator {
  static validateCreate(body: unknown): z.infer<typeof createNoteSchema> {
    const result = createNoteSchema.safeParse(body);
    if (!result.success) {
      throw new ValidationError('Invalid note', result.error.flatten());
    }
    return result.data;
  }
}