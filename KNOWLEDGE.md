# CoreGuard — AI Agent Knowledge Base

> **Purpose:** This file is the onboarding document for AI sub-agents working on this project. Read it before writing any code. It contains all context a new agent needs: the tech stack, file map, database schema, API contracts, class patterns, and enforced conventions.

---

## 1. Project Summary

**CoreGuard** is a Risk Review Console where security/operations teams inspect supply-chain risk events, review evidence, assign ownership, take action (review/escalate/ignore/resolve), and audit every change.

**Two user roles:**
- **Operator:** View, filter, search, review, escalate, ignore, assign owner, add notes. **Cannot resolve.**
- **Manager:** All of the above + resolve events.

---

## 2. Tech Stack — Quick Reference

| Layer | Technology | Package |
|-------|-----------|---------|
| Framework | Next.js 15 (App Router) | `next` |
| Language | TypeScript 5 (strict mode) | `typescript` |
| Styling | Tailwind CSS 4 | `tailwindcss` + `@tailwindcss/postcss` |
| Auth | NextAuth.js v5 | `next-auth` |
| Database | PostgreSQL 16 (via Supabase) | `pg` (node-postgres) |
| Connection Pool | PgBouncer (transaction mode) | Built into Supabase |
| Validation | Zod 3 | `zod` |
| Logging | Pino (wrapped in CustomLogger) | `pino` |
| Data Fetching | SWR | `swr` |
| Testing (unit/int) | Jest 29 | `jest` + `ts-jest` |
| Testing (e2e) | Playwright | `@playwright/test` |
| Package Manager | **npm** | Not pnpm, not yarn |

---

## 3. File Map — Where Everything Lives

```
src/app/                             Next.js pages + API routes (thin — delegate to services)
src/components/                      React components (≤200 LOC each, split by domain)
src/server/db/connection.ts           ConnectionPool singleton (PgBouncer-aware)
src/server/db/schema.sql              Raw DDL (no migrations)
src/server/db/repositories/           Repository classes (raw SQL)
src/server/services/                  Business logic classes (constructor injection)
src/server/validators/                Zod schemas wrapped in validator classes
src/lib/                             Shared utilities (logger, errors, constants, API response helpers)
src/hooks/                           React hooks (useEvents, usePolling, useAuth, etc.)
src/types/                           TypeScript interfaces and types
src/auth.ts                          NextAuth configuration
tests/unit/                          Jest — service, repository, validator tests
tests/integration/                   Jest — API route tests with supertest
tests/e2e/                           Playwright — browser workflow tests
```

### Naming Conventions

| Artifact | Convention | Example |
|----------|-----------|---------|
| Component files | `PascalCase.tsx` | `EventTable.tsx` |
| Component functions | `PascalCase` | `function EventTable() {}` |
| Service files | `kebab-case.service.ts` | `event.service.ts` |
| Service classes | `PascalCaseService` | `class EventService {}` |
| Repository files | `kebab-case.repository.ts` | `event.repository.ts` |
| Repository classes | `PascalCaseRepository` | `class EventRepository` |
| Validator files | `kebab-case.validator.ts` | `event.validator.ts` |
| Validator classes | `PascalCaseValidator` | `class EventValidator {}` |
| Test files | `kebab-case.test.ts` | `event.service.test.ts` |
| Methods | `camelCase` | `transitionStatus()`, `findById()` |
| DB table names | `snake_case` | `audit_log`, `risk_events` |
| DB column names | `snake_case` | `detected_at`, `changed_by` |
| Env variables | `UPPER_SNAKE_CASE` | `DATABASE_URL`, `NEXTAUTH_SECRET` |

---

## 4. Database Reference

### Tables (5)

#### `users`
```sql
CREATE TYPE user_role AS ENUM ('operator', 'manager');
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role user_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `events`
```sql
CREATE TYPE severity_enum AS ENUM ('critical', 'high', 'medium', 'low');
CREATE TYPE event_status_enum AS ENUM ('new', 'reviewed', 'escalated', 'ignored', 'resolved');

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier TEXT NOT NULL,
  part_asset TEXT NOT NULL,
  severity severity_enum NOT NULL,
  status event_status_enum DEFAULT 'new',
  summary TEXT NOT NULL,
  detected_at TIMESTAMPTZ NOT NULL,
  source TEXT NOT NULL,
  owner_id UUID REFERENCES users(id),
  recommended_action TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_events_severity ON events(severity);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_detected_at ON events(detected_at DESC);
CREATE INDEX idx_events_owner ON events(owner_id);
```

#### `audit_log` — **IMMUTABLE. No UPDATE/DELETE grants. No update/delete repository methods.**
```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) NOT NULL,
  changed_by UUID REFERENCES users(id) NOT NULL,
  action TEXT NOT NULL,
  field_changed TEXT,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_audit_event ON audit_log(event_id);
-- Application user has only SELECT + INSERT on this table
-- REVOKE UPDATE, DELETE ON audit_log FROM app_user;
```

#### `notes` — **IMMUTABLE after INSERT.**
```sql
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) NOT NULL,
  author_id UUID REFERENCES users(id) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_notes_event ON notes(event_id);
-- REVOKE UPDATE, DELETE ON notes FROM app_user;
```

#### `evidence` — **IMMUTABLE after INSERT.**
```sql
CREATE TABLE evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) NOT NULL,
  title TEXT NOT NULL,
  link TEXT,
  type TEXT NOT NULL,
  added_by UUID REFERENCES users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_evidence_event ON evidence(event_id);
-- REVOKE UPDATE, DELETE ON evidence FROM app_user;
```

### Entity Relationships

```
users ──< events (owner_id, optional FK)
users ──< audit_log (changed_by FK)
users ──< notes (author_id FK)
users ──< evidence (added_by FK)
events ──< audit_log (event_id FK)
events ──< notes (event_id FK)
events ──< evidence (event_id FK)
```

---

## 5. API Reference

| Method | Path | Role | Query/Body | Response |
|--------|------|------|------------|----------|
| `GET` | `/api/events` | Any | `?severity=&status=&owner=&source=&search=&sort=detected_at&order=desc&page=1&limit=20` | `{ data: RiskEvent[], meta: { page, total, totalPages } }` |
| `GET` | `/api/events/[id]` | Any | — | `{ data: { event, notes[], evidence[], auditLog[] } }` |
| `PATCH` | `/api/events/[id]` | Operator+ | `{ status: 'reviewed' \| 'escalated' \| 'ignored' }` or `{ owner_id: UUID }` | `{ data: RiskEvent }` |
| `PATCH` | `/api/events/[id]` | **Manager** | `{ status: 'resolved' }` | `{ data: RiskEvent }` or `{ error: { code: 'FORBIDDEN' } }` (403) |
| `POST` | `/api/events/[id]/notes` | Any | `{ content: string }` | `{ data: Note }` |
| `POST` | `/api/seed` | Dev only | `?reset=true` | `{ data: { message: 'Seeded 25 events' } }` |
| `GET` | `/api/healthz` | None | — | `{ status: 'ok', db: 'connected' }` |

### Standard Error Response

```typescript
{
  error: {
    code: 'FORBIDDEN' | 'NOT_FOUND' | 'VALIDATION_ERROR' | 'INTERNAL_ERROR',
    message: string,
    details?: unknown
  }
}
```

---

## 6. Auth & Roles

### NextAuth Config Pattern

```typescript
// src/auth.ts
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authConfig = {
  providers: [
    CredentialsProvider({
      name: 'Mock Login',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // Query user by email from DB
        // Return { id, name, email, role } — any password accepted (mock)
      },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) { token.role = (user as any).role; }
      return token;
    },
    async session({ session, token }) {
      (session.user as any).role = token.role;
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
```

### Permission Matrix

| Action | Operator | Manager |
|--------|:-------:|:-------:|
| View events | Yes | Yes |
| Filter/search | Yes | Yes |
| Review | Yes | Yes |
| Escalate | Yes | Yes |
| Ignore | Yes | Yes |
| Assign owner | Yes | Yes |
| Add note | Yes | Yes |
| **Resolve** | **No (403)** | **Yes** |

---

## 7. State Machine

```
  New ──► Reviewed ──► Resolved (manager only)
  │       │
  │       ├──► Escalated ──► Resolved (manager only)
  │       │
  │       └──► Ignored ──► Resolved (manager only)
  │                        │
  └────────────────────────┘ (re-open: ignored → new)
```

**Validated in:** `src/server/services/event.service.ts` → `transitionStatus()` method.

```typescript
const ALLOWED_TRANSITIONS: Record<EventStatus, EventStatus[]> = {
  new: ['reviewed', 'escalated', 'ignored'],
  reviewed: ['resolved'],
  escalated: ['resolved'],
  ignored: ['resolved', 'new'],
  resolved: [], // terminal
};
```

---

## 8. Class Patterns — With Inline Code

### 8.1 ConnectionPool (Singleton)

```typescript
// src/server/db/connection.ts
import { Pool, PoolConfig, QueryResult } from 'pg';

export class ConnectionPool {
  private static instance: ConnectionPool | null = null;
  private pool: Pool;

  private constructor() {
    const config: PoolConfig = {
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
      ssl: process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : undefined,
    };
    this.pool = new Pool(config);
  }

  static getInstance(): ConnectionPool {
    if (!ConnectionPool.instance) {
      ConnectionPool.instance = new ConnectionPool();
    }
    return ConnectionPool.instance;
  }

  async query<T>(sql: string, params?: unknown[]): Promise<T[]> {
    const result: QueryResult = await this.pool.query(sql, params);
    return result.rows as T[];
  }

  async queryOne<T>(sql: string, params?: unknown[]): Promise<T | null> {
    const rows = await this.query<T>(sql, params);
    return rows[0] ?? null;
  }

  async execute(sql: string, params?: unknown[]): Promise<number> {
    const result = await this.pool.query(sql, params);
    return result.rowCount ?? 0;
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.pool.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }

  async end(): Promise<void> {
    await this.pool.end();
    ConnectionPool.instance = null;
  }
}
```

### 8.2 BaseRepository (Abstract)

```typescript
// src/server/db/repositories/base.repository.ts
import { ConnectionPool } from '../connection';

export abstract class BaseRepository<T> {
  protected db: ConnectionPool;

  constructor() {
    this.db = ConnectionPool.getInstance();
  }

  protected async query(sql: string, params?: unknown[]): Promise<T[]> {
    return this.db.query<T>(sql, params);
  }

  protected async queryOne(sql: string, params?: unknown[]): Promise<T | null> {
    return this.db.queryOne<T>(sql, params);
  }

  protected async execute(sql: string, params?: unknown[]): Promise<number> {
    return this.db.execute(sql, params);
  }
}
```

### 8.3 EventRepository

```typescript
// src/server/db/repositories/event.repository.ts
import { BaseRepository } from './base.repository';
import { RiskEvent, EventFilters, PaginatedResponse } from '@/types';

export class EventRepository extends BaseRepository<RiskEvent> {
  async listEvents(filters: EventFilters): Promise<PaginatedResponse<RiskEvent>> {
    const where: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (filters.severity) {
      where.push(`severity = $${paramIndex++}`);
      params.push(filters.severity);
    }
    if (filters.status) {
      where.push(`status = $${paramIndex++}`);
      params.push(filters.status);
    }
    if (filters.owner) {
      where.push(`owner_id = $${paramIndex++}`);
      params.push(filters.owner);
    }
    if (filters.source) {
      where.push(`source = $${paramIndex++}`);
      params.push(filters.source);
    }
    if (filters.search) {
      where.push(`(
        supplier ILIKE $${paramIndex} OR
        part_asset ILIKE $${paramIndex} OR
        source ILIKE $${paramIndex} OR
        summary ILIKE $${paramIndex}
      )`);
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    const whereClause = where.length > 0
      ? `WHERE ${where.join(' AND ')}`
      : '';

    const sortColumn = filters.sort ?? 'detected_at';
    const sortOrder = filters.order ?? 'desc';
    const limit = Math.min(filters.limit ?? 20, 100);
    const offset = ((filters.page ?? 1) - 1) * limit;

    const countSql = `SELECT COUNT(*) as total FROM events ${whereClause}`;
    const countResult = await this.query<{ total: number }>(countSql, params);
    const total = Number(countResult[0]?.total ?? 0);

    const dataSql = `
      SELECT e.*, u.name as owner_name
      FROM events e
      LEFT JOIN users u ON e.owner_id = u.id
      ${whereClause}
      ORDER BY ${sortColumn} ${sortOrder}
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    const data = await this.query<RiskEvent>(dataSql, [
      ...params, limit, offset,
    ]);

    return {
      data,
      meta: { page: filters.page ?? 1, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string): Promise<RiskEvent | null> {
    return this.queryOne(`
      SELECT e.*, u.name as owner_name
      FROM events e
      LEFT JOIN users u ON e.owner_id = u.id
      WHERE e.id = $1
    `, [id]);
  }

  async updateStatus(id: string, status: string): Promise<void> {
    await this.execute(`
      UPDATE events
      SET status = $1, updated_at = now(),
          resolved_at = CASE WHEN $1 = 'resolved' THEN now() ELSE resolved_at END
      WHERE id = $2
    `, [status, id]);
  }

  async assignOwner(id: string, ownerId: string): Promise<void> {
    await this.execute(`
      UPDATE events SET owner_id = $1, updated_at = now() WHERE id = $2
    `, [ownerId, id]);
  }
}
```

### 8.4 AuditRepository (Append-Only)

```typescript
// src/server/db/repositories/audit.repository.ts
import { BaseRepository } from './base.repository';
import { AuditEntry } from '@/types';

export class AuditRepository extends BaseRepository<AuditEntry> {
  async insertEntry(
    eventId: string,
    changedBy: string,
    action: string,
    fieldChanged: string | null,
    oldValue: string | null,
    newValue: string | null,
  ): Promise<AuditEntry> {
    const rows = await this.query<AuditEntry>(`
      INSERT INTO audit_log (event_id, changed_by, action, field_changed, old_value, new_value)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [eventId, changedBy, action, fieldChanged, oldValue, newValue]);
    return rows[0]!;
  }

  async findByEventId(eventId: string): Promise<AuditEntry[]> {
    return this.query(`
      SELECT al.*, u.name as changed_by_name
      FROM audit_log al
      JOIN users u ON al.changed_by = u.id
      WHERE al.event_id = $1
      ORDER BY al.created_at ASC
    `, [eventId]);
  }

  // ⚠️ NO update() method — design choice, enforced by this class
  // ⚠️ NO delete() method — design choice, enforced by this class
  // ⚠️ NO truncate() method — design choice, enforced by this class
}
```

### 8.5 AuthService

```typescript
// src/server/services/auth.service.ts
import { Session } from 'next-auth';
import { ForbiddenError } from '@/lib/errors';
import { UserRole } from '@/types/user';

export class AuthService {
  static requireRole(session: Session | null, ...roles: UserRole[]): void {
    if (!session?.user) {
      throw new ForbiddenError('Authentication required');
    }

    const userRole = (session.user as any).role as UserRole | undefined;

    if (!userRole || !roles.includes(userRole)) {
      throw new ForbiddenError(
        `This action requires one of: ${roles.join(', ')}. Your role: ${userRole ?? 'none'}`
      );
    }
  }

  static hasRole(session: Session | null, role: UserRole): boolean {
    if (!session?.user) return false;
    return (session.user as any).role === role;
  }
}
```

### 8.6 EventService

```typescript
// src/server/services/event.service.ts
import { EventRepository } from '@/server/db/repositories/event.repository';
import { AuditRepository } from '@/server/db/repositories/audit.repository';
import { NoteRepository } from '@/server/db/repositories/note.repository';
import { EvidenceRepository } from '@/server/db/repositories/evidence.repository';
import { AuthService } from './auth.service';
import { CustomLogger } from '@/lib/logger';
import { ValidationError } from '@/lib/errors';
import { EventStatus, EventFilters } from '@/types';
import { Session } from 'next-auth';

const ALLOWED_TRANSITIONS: Record<EventStatus, EventStatus[]> = {
  new: ['reviewed', 'escalated', 'ignored'],
  reviewed: ['resolved'],
  escalated: ['resolved'],
  ignored: ['resolved', 'new'],
  resolved: [],
};

export class EventService {
  private logger = new CustomLogger('EventService');

  constructor(
    private readonly eventRepo: EventRepository,
    private readonly auditRepo: AuditRepository,
    private readonly noteRepo: NoteRepository,
    private readonly evidenceRepo: EvidenceRepository,
  ) {}

  async listEvents(filters: EventFilters) {
    this.logger.debug('Listing events', { filters });
    return this.eventRepo.listEvents(filters);
  }

  async getEventDetail(eventId: string) {
    const [event, notes, evidence, auditLog] = await Promise.all([
      this.eventRepo.findById(eventId),
      this.noteRepo.findByEventId(eventId),
      this.evidenceRepo.findByEventId(eventId),
      this.auditRepo.findByEventId(eventId),
    ]);

    if (!event) {
      this.logger.warn('Event not found', { eventId });
      return null;
    }

    return { event, notes, evidence, auditLog };
  }

  async transitionStatus(
    eventId: string,
    newStatus: EventStatus,
    session: Session,
  ): Promise<void> {
    const current = await this.eventRepo.findById(eventId);
    if (!current) throw new ValidationError(`Event ${eventId} not found`);

    if (newStatus === 'resolved') {
      AuthService.requireRole(session, 'manager');
    }

    const allowed = ALLOWED_TRANSITIONS[current.status] ?? [];
    if (!allowed.includes(newStatus)) {
      throw new ValidationError(
        `Cannot transition from ${current.status} to ${newStatus}`
      );
    }

    await this.eventRepo.updateStatus(eventId, newStatus);

    await this.auditRepo.insertEntry(
      eventId,
      session.user!.id,
      'status_changed',
      'status',
      current.status,
      newStatus,
    );

    this.logger.info('Status transitioned', {
      eventId,
      from: current.status,
      to: newStatus,
      userId: session.user!.id,
    });
  }

  async assignOwner(eventId: string, newOwnerId: string, session: Session): Promise<void> {
    const current = await this.eventRepo.findById(eventId);
    if (!current) throw new ValidationError(`Event ${eventId} not found`);

    await this.eventRepo.assignOwner(eventId, newOwnerId);

    await this.auditRepo.insertEntry(
      eventId,
      session.user!.id,
      'owner_assigned',
      'owner_id',
      current.owner_id ?? null,
      newOwnerId,
    );

    this.logger.info('Owner assigned', { eventId, from: current.owner_id, to: newOwnerId });
  }
}
```

### 8.7 CustomLogger

```typescript
// src/lib/logger.ts
import pino from 'pino';

export class CustomLogger {
  private logger: pino.Logger;

  constructor(component: string) {
    this.logger = pino({
      name: 'coreguard',
      level: process.env.LOG_LEVEL ?? 'info',
      base: { component },
      transport: process.env.NODE_ENV !== 'production'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
    });
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.logger.info(context, message);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.logger.warn(context, message);
  }

  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.logger.error({ ...context, err: error }, message);
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.logger.debug(context, message);
  }
}
```

---

## 9. Seeding Rules

### Deterministic Seed

```typescript
// Uses seedrandom package with fixed seed
import seedrandom from 'seedrandom';
const rng = seedrandom(process.env.SEED_FIXED_SEED ?? 'coreguard-default-seed');
```

### Seed Data Requirements

| Entity | Count | Notes |
|--------|-------|-------|
| Users | 4 | 2 operators, 2 managers |
| Events | 25+ | All severities and statuses mixed |
| Evidence | 30+ | At least 1 event has 2+ items |
| Notes | 15+ | At least 1 event has multiple notes |
| Audit Log | 10+ | At least 1 event has multiple timeline entries (status history) |

### Reset Flow

```
1. TRUNCATE all 5 tables (CASCADE)
2. Re-seed users
3. Re-seed events
4. Re-seed evidence
5. Re-seed notes
6. Re-seed audit entries (simulate status history on 2-3 events)
```

---

## 10. Component Patterns

### Rules

1. **`'use client'` directive** — only add when the component needs browser APIs (hooks, state, event handlers). Server components are the default.
2. **Loading state:** Every data-fetching component renders a spinner while loading.
3. **Error state:** Every data-fetching component renders `ErrorBanner` on fetch failure.
4. **Empty state:** Lists render `EmptyState` when no data matches filters.
5. **No anonymous inline functions as props** — extract to named functions or `useCallback`.
6. **File length:** Split before hitting 200 lines. Delegate focused sub-components.

### Data Fetching Pattern

```tsx
// src/hooks/useEvents.ts
import useSWR from 'swr';
import { EventFilters } from '@/types';

function buildUrl(filters: EventFilters): string {
  const params = new URLSearchParams();
  if (filters.severity) params.set('severity', filters.severity);
  if (filters.status) params.set('status', filters.status);
  if (filters.search) params.set('search', filters.search);
  if (filters.sort) params.set('sort', filters.sort);
  if (filters.page) params.set('page', String(filters.page));
  return `/api/events?${params.toString()}`;
}

export function useEvents(filters: EventFilters, refreshInterval = 30_000) {
  const { data, error, isLoading, mutate } = useSWR(
    buildUrl(filters),
    (url: string) => fetch(url).then(res => res.json()),
    {
      refreshInterval,       // polling
      revalidateOnFocus: true,
      dedupingInterval: 2000,
    },
  );

  return { events: data?.data ?? [], meta: data?.meta, isLoading, error, refresh: mutate };
}
```

### Filter State Hook

```tsx
// src/hooks/useFilters.ts
'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { EventFilters } from '@/types';

export function useFilters(): {
  filters: EventFilters;
  setFilter: (key: keyof EventFilters, value: string | undefined) => void;
  clearFilters: () => void;
} {
  const router = useRouter();
  const searchParams = useSearchParams();

  const filters: EventFilters = {
    severity: searchParams.get('severity') ?? undefined,
    status: searchParams.get('status') ?? undefined,
    search: searchParams.get('search') ?? undefined,
    sort: searchParams.get('sort') ?? 'detected_at',
    order: (searchParams.get('order') as 'asc' | 'desc') ?? 'desc',
    page: Number(searchParams.get('page')) || 1,
  };

  const setFilter = useCallback(
    (key: keyof EventFilters, value: string | undefined) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) { params.set(key, value); }
      else { params.delete(key); }
      if (key !== 'page') params.set('page', '1');
      router.push(`/events?${params.toString()}`);
    },
    [router, searchParams],
  );

  const clearFilters = useCallback(() => {
    router.push('/events');
  }, [router]);

  return { filters, setFilter, clearFilters };
}
```

---

## 11. Error Classes

```typescript
// src/lib/errors.ts
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super('NOT_FOUND', message, 404);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super('FORBIDDEN', message, 403);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super('VALIDATION_ERROR', message, 400, details);
  }
}
```

### API Response Helper

```typescript
// src/lib/api-response.ts
import { NextResponse } from 'next/server';
import { AppError } from './errors';

export class ApiResponse {
  static success<T>(data: T, meta?: Record<string, unknown>) {
    return NextResponse.json({ data, meta }, { status: 200 });
  }

  static created<T>(data: T) {
    return NextResponse.json({ data }, { status: 201 });
  }

  static error(error: AppError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      { status: error.statusCode },
    );
  }
}
```

---

## 12. Route Handler Pattern

Every API route handler follows this pattern:

```typescript
// src/app/api/events/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/auth';
import { ApiResponse } from '@/lib/api-response';
import { AppError } from '@/lib/errors';

// Always include this for Vercel
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    // Parse query params, call service, return response
    return ApiResponse.success(data, meta);
  } catch (error) {
    if (error instanceof AppError) {
      return ApiResponse.error(error);
    }
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } },
      { status: 500 },
    );
  }
}
```

---

## 13. Environment Variables

| Variable | Required | Default | Description |
|----------|:--------:|---------|-------------|
| `DATABASE_URL` | Yes | — | Postgres connection string (with `?pgbouncer=true`) |
| `NEXTAUTH_SECRET` | Yes | — | 64-char random string for JWT signing |
| `NEXTAUTH_URL` | Yes | `http://localhost:3000` | App URL |
| `SEED_FIXED_SEED` | No | `coreguard-default-seed` | Fixed seed for deterministic data |
| `ALLOW_SEED` | No | `true` in dev | Set to `true` to enable `/api/seed` endpoint |
| `LOG_LEVEL` | No | `info` | Pino log level |

---

## 14. Quick Start for a New Agent

1. **Read this file** (you're doing it now).
2. **Understand the two roles:** Operator can't resolve; Manager can.
3. **Pick a ticket:**
   - **Adding a new API endpoint:** Follow the route handler pattern above. Create or reuse a service class.
   - **Adding a UI component:** Check `src/components/` for similar patterns. Stay under 200 lines.
   - **Adding a test:** Look at `tests/` for the test file pattern. Use Jest for API tests, Playwright for browser flows.
4. **Follow the class pattern:** Every DB operation goes through a `Repository` class. Every business rule goes through a `Service` class.
5. **Always enforce roles server-side:** Use `AuthService.requireRole(session, 'manager')` in route handlers.
6. **Write audit entries for every mutation:** Call `AuditRepository.insertEntry()` after any state change.
7. **Keep files under 200 lines:** If your file is growing, extract a helper class or sub-component.

---

*Last updated: 2026-05-15. Update this file whenever the architecture changes.*