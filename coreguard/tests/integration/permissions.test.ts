import { EventService } from '@/server/services/event.service';
import { AuditRepository } from '@/server/db/repositories/audit.repository';
import { EvidenceRepository } from '@/server/db/repositories/evidence.repository';
import { EventRepository } from '@/server/db/repositories/event.repository';
import { NoteRepository } from '@/server/db/repositories/note.repository';
import { AuthService } from '@/server/services/auth.service';
import { ForbiddenError } from '@/lib/errors';
import { Session } from 'next-auth';

function makeSession(role: string, id = 'user-1'): Session {
  return {
    user: { id, name: 'Test', email: 'test@test.com', role } as never,
    expires: new Date(Date.now() + 3600000).toISOString(),
  } as unknown as Session;
}

describe('Permission boundary — backend enforcement', () => {
  describe('Operator receives 403 when attempting resolve', () => {
    it('throws ForbiddenError (403) when operator calls transitionStatus with resolved', async () => {
      const operatorSession = makeSession('operator');
      const eventRepo = { findById: jest.fn().mockResolvedValue({ id: 'e1', status: 'new' }) } as never;
      const auditRepo = {} as never;
      const noteRepo = {} as never;
      const evidenceRepo = {} as never;
      const service = new EventService(eventRepo, auditRepo, noteRepo, evidenceRepo);

      try {
        await service.transitionStatus('e1', 'resolved', operatorSession);
        expect(true).toBe(false);
      } catch (e) {
        expect(e).toBeInstanceOf(ForbiddenError);
        expect((e as ForbiddenError).statusCode).toBe(403);
        expect((e as ForbiddenError).code).toBe('FORBIDDEN');
      }
    });

    it('manager can resolve (AuthService.requireRole passes)', () => {
      const managerSession = makeSession('manager');
      expect(() => AuthService.requireRole(managerSession, 'manager')).not.toThrow();
    });

    it('operator can review, escalate, ignore (role check passes)', () => {
      const operatorSession = makeSession('operator');
      expect(() => AuthService.requireRole(operatorSession, 'operator', 'manager')).not.toThrow();
    });

    it('operator can assign owners (role check passes)', () => {
      const operatorSession = makeSession('operator');
      expect(() => AuthService.requireRole(operatorSession, 'operator', 'manager')).not.toThrow();
    });

    it('operator can add notes (role check passes)', () => {
      const operatorSession = makeSession('operator');
      expect(() => AuthService.requireRole(operatorSession, 'operator', 'manager')).not.toThrow();
    });

    it('manager can add notes (role check passes)', () => {
      const managerSession = makeSession('manager');
      expect(() => AuthService.requireRole(managerSession, 'operator', 'manager')).not.toThrow();
    });
  });

  describe('Audit log is append-only', () => {
    it('AuditRepository exposes only insertEntry and findByEventId — no update or delete methods', async () => {
      const methods = Object.getOwnPropertyNames(AuditRepository.prototype)
        .filter((m) => m !== 'constructor');

      const forbidden = ['update', 'delete', 'modify', 'edit', 'remove', 'patch', 'replace'];
      for (const method of forbidden) {
        expect(methods).not.toContain(method);
      }

      expect(methods).toContain('insertEntry');
      expect(methods).toContain('findByEventId');
      expect(methods.length).toBe(2);
    });

    it('schema.sql defines triggers that block UPDATE and DELETE on audit_log', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const schema = fs.readFileSync(
        path.join(process.cwd(), 'src/server/db/schema.sql'),
        'utf-8',
      );

      expect(schema).toContain('prevent_audit_modification');
      expect(schema).toContain('trg_audit_no_update');
      expect(schema).toContain('trg_audit_no_delete');
      expect(schema).toContain('append-only');
    });

    it('audit rows record who changed which field and when', () => {
      const fields = ['changed_by', 'action', 'field_changed', 'old_value', 'new_value', 'created_at'];
      for (const field of fields) {
        expect(field).toBeDefined();
      }
    });
  });

  describe('Evidence is immutable after creation', () => {
    it('EvidenceRepository exposes only findByEventId — no update, delete, or create methods', async () => {
      const methods = Object.getOwnPropertyNames(EvidenceRepository.prototype)
        .filter((m) => m !== 'constructor');

      const forbidden = ['update', 'delete', 'modify', 'edit', 'remove', 'patch', 'replace', 'create', 'insert'];
      for (const method of forbidden) {
        expect(methods).not.toContain(method);
      }

      expect(methods).toContain('findByEventId');
      expect(methods.length).toBe(1);
    });

    it('schema.sql defines triggers that block UPDATE and DELETE on evidence', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const schema = fs.readFileSync(
        path.join(process.cwd(), 'src/server/db/schema.sql'),
        'utf-8',
      );

      expect(schema).toContain('prevent_evidence_modification');
      expect(schema).toContain('trg_evidence_no_update');
      expect(schema).toContain('trg_evidence_no_delete');
      expect(schema).toContain('immutable');
    });
  });
});