import { AuditRepository } from '@/server/db/repositories/audit.repository';
import { NoteRepository } from '@/server/db/repositories/note.repository';
import { EvidenceRepository } from '@/server/db/repositories/evidence.repository';

describe('Audit repository — append-only enforcement', () => {
  it('has no update, delete, truncate, modify, edit, or remove methods', () => {
    const methods = Object.getOwnPropertyNames(AuditRepository.prototype);
    const mutableMethods = ['update', 'delete', 'truncate', 'modify', 'edit', 'remove'];
    for (const method of mutableMethods) {
      expect(methods).not.toContain(method);
    }
  });

  it('exposes only insertEntry and findByEventId', () => {
    const methods = Object.getOwnPropertyNames(AuditRepository.prototype)
      .filter((m) => m !== 'constructor');
    expect(methods).toContain('insertEntry');
    expect(methods).toContain('findByEventId');
  });
});

describe('Note repository — immutable after create', () => {
  it('has no update or delete methods', () => {
    const methods = Object.getOwnPropertyNames(NoteRepository.prototype);
    expect(methods).not.toContain('update');
    expect(methods).not.toContain('delete');
  });
});

describe('Evidence repository — immutable after create', () => {
  it('has no update or delete methods', () => {
    const methods = Object.getOwnPropertyNames(EvidenceRepository.prototype);
    expect(methods).not.toContain('update');
    expect(methods).not.toContain('delete');
  });
});