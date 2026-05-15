# CoreGuard — Project Architecture

> Risk Review Console: inspect incoming risk events, review evidence, assign ownership, take action, audit changes.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Directory Structure](#directory-structure)
3. [OOP Class Hierarchy](#oop-class-hierarchy)
4. [Database Reference](#database-reference)
5. [API Route Boundaries](#api-route-boundaries)
6. [State Machine (Status Transitions)](#state-machine)
7. [Connection Pool (PgBouncer)](#connection-pool)
8. [Authentication & Roles](#authentication--roles)
9. [Audit Log Design](#audit-log-design)
10. [Testing Strategy](#testing-strategy)
11. [File Size Governance](#file-size-governance)
12. [Deployment Architecture](#deployment-architecture)

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 15.x |
| Language | TypeScript (strict) | 5.x |
| Styling | Tailwind CSS | 4.x |
| Auth | NextAuth.js (Auth.js) | 5.x |
| Database | PostgreSQL | 16.x |
| Connection Pool | PgBouncer | latest |
| DB Client | `pg` (node-postgres) | 8.x |
| Validation | Zod | 3.x |
| Logging | Pino (custom wrapper) | 9.x |
| Testing (unit/integration) | Jest | 29.x |
| Testing (e2e) | Playwright | 1.x |
| Package Manager | npm | — |
| Hosting | Vercel | — |
| DB Hosting | Supabase (managed Postgres) | — |

---

## Directory Structure

```
coreguard/
├── src/
│   ├── app/                                    # Next.js App Router (thin route handlers)
│   │   ├── layout.tsx                          # Root layout — providers, auth session
│   │   ├── page.tsx                            # Redirect: / → /events
│   │   │
│   │   ├── (auth)/
│   │   │   └── login/
│   │   │       └── page.tsx                    # Mock login form + role selector
│   │   │
│   │   ├── (console)/
│   │   │   ├── layout.tsx                      # Console shell: sidebar + header + role badge
│   │   │   ├── events/
│   │   │   │   ├── page.tsx                    # Risk event queue — table + filters + search
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx                # Event detail — timeline, evidence, notes, actions
│   │   │   └── dashboard/
│   │   │       └── page.tsx                    # (Optional) KPI summary cards
│   │   │
│   │   └── api/
│   │       ├── auth/
│   │       │   └── [...nextauth]/
│   │       │       └── route.ts                # NextAuth handler
│   │       ├── events/
│   │       │   ├── route.ts                    # GET  — list/search/filter/sort
│   │       │   └── [id]/
│   │       │       ├── route.ts                # GET  — detail | PATCH — status/owner transition
│   │       │       └── notes/
│   │       │           └── route.ts            # POST — add note
│   │       ├── seed/
│   │       │   └── route.ts                    # POST — ?reset=true triggers reset+re-seed
│   │       └── healthz/
│   │           └── route.ts                    # GET  — DB connectivity ping
│   │
│   ├── components/                             # React components (each ≤ 200 LOC)
│   │   ├── ui/                                 # Atomic design primitives
│   │   │   ├── Button.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Spinner.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   └── ErrorBanner.tsx
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── ConsoleShell.tsx
│   │   ├── events/
│   │   │   ├── EventTable.tsx                  # Sortable risk-event table
│   │   │   ├── EventRow.tsx                    # Single row
│   │   │   ├── EventFilters.tsx                # Filter bar + search input
│   │   │   ├── EventDetailPanel.tsx            # Header + metadata
│   │   │   ├── EventTimeline.tsx               # Audit entries rendered as timeline
│   │   │   ├── EventActions.tsx                # Review/Escalate/Ignore/Resolve buttons
│   │   │   ├── AssignOwner.tsx                 # Owner combobox
│   │   │   ├── NotesList.tsx                   # Note thread
│   │   │   ├── AddNoteForm.tsx                 # Inline note composer
│   │   │   └── EvidenceList.tsx                # Read-only evidence items
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   └── RoleSwitcher.tsx
│   │   └── dashboard/
│   │       └── SummaryCards.tsx
│   │
│   ├── server/
│   │   ├── db/
│   │   │   ├── connection.ts                   # ConnectionPool singleton (PgBouncer-ready)
│   │   │   ├── schema.sql                      # Raw DDL — tables, indexes, constraints
│   │   │   └── repositories/
│   │   │       ├── base.repository.ts           # abstract BaseRepository<T>
│   │   │       ├── event.repository.ts          # EventRepository extends BaseRepository
│   │   │       ├── audit.repository.ts          # AuditRepository (append-only)
│   │   │       ├── note.repository.ts           # NoteRepository (immutable after create)
│   │   │       ├── evidence.repository.ts       # EvidenceRepository (immutable after create)
│   │   │       └── user.repository.ts           # UserRepository
│   │   │
│   │   ├── services/
│   │   │   ├── event.service.ts                 # EventService: list, detail, status transitions
│   │   │   ├── audit.service.ts                 # AuditService: append-only writes
│   │   │   ├── auth.service.ts                  # AuthService: role checks, requireRole()
│   │   │   └── seed.service.ts                  # SeedService: deterministic seeding + reset
│   │   │
│   │   └── validators/
│   │       ├── event.validator.ts               # EventValidator class (Zod-backed)
│   │       ├── note.validator.ts                # NoteValidator class
│   │       └── filter.validator.ts              # FilterValidator class
│   │
│   ├── lib/
│   │   ├── logger.ts                            # CustomLogger class (Pino wrapper)
│   │   ├── errors.ts                            # AppError, NotFoundError, ForbiddenError, ValidationError
│   │   ├── constants.ts                         # Severity, EventStatus, UserRole, Source enums
│   │   ├── api-response.ts                      # ApiResponse.success() / .error() helpers
│   │   └── utils.ts                             # formatDate, debounce, etc.
│   │
│   ├── hooks/
│   │   ├── useEvents.ts                         # SWR fetch + polling
│   │   ├── useEventDetail.ts                    # Single event fetch
│   │   ├── usePolling.ts                        # Configurable-interval poller
│   │   ├── useFilters.ts                        # Filter state ↔ URL searchParams sync
│   │   └── useAuth.ts                           # Session + role hooks
│   │
│   ├── types/
│   │   ├── event.ts                             # RiskEvent, EventStatus, Severity, Transition
│   │   ├── audit.ts                             # AuditEntry
│   │   ├── note.ts                              # Note
│   │   ├── evidence.ts                          # Evidence
│   │   ├── user.ts                              # User, UserRole
│   │   └── api.ts                               # PaginatedResponse<T>, ApiError, SortDirection
│   │
│   └── auth.ts                                  # NextAuth config: CredentialsProvider + JWT callbacks
│
├── tests/
│   ├── unit/
│   │   ├── services/
│   │   │   ├── event.service.test.ts
│   │   │   ├── audit.service.test.ts
│   │   │   └── seed.service.test.ts
│   │   ├── repositories/
│   │   │   └── event.repository.test.ts
│   │   └── validators/
│   │       └── event.validator.test.ts
│   ├── integration/
│   │   ├── api/
│   │   │   ├── events.test.ts
│   │   │   └── notes.test.ts
│   │   ├── auth.test.ts
│   │   ├── audit.test.ts
│   │   └── healthz.test.ts
│   └── e2e/
│       └── event-workflow.spec.ts               # Playwright
│
├── public/
├── .env.example
├── .gitignore
├── jest.config.ts
├── jest.setup.ts
├── playwright.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── next.config.ts
├── package.json
├── README.md
├── KNOWLEDGE.md
└── AI_USAGE.md
```

---

## OOP Class Hierarchy

```
ConnectionPool (singleton)
  └── BaseRepository<T> (abstract)
        ├── EventRepository
        ├── AuditRepository       ← NO update/delete methods (enforced at class level)
        ├── NoteRepository        ← NO update/delete methods (immutable)
        ├── EvidenceRepository    ← NO update/delete methods (immutable)
        └── UserRepository

AuthService (class)
  ├── hasRole(session, role): boolean
  └── requireRole(role): MiddlewareFn

EventService (class)
  ├── constructor(eventRepo, auditService, authService)
  ├── listEvents(filters): PaginatedResponse<RiskEvent>
  ├── getEventDetail(id): EventDetail (event + notes + evidence + audit timeline)
  ├── transitionStatus(id, newStatus, userId): void   ← validates transitions, writes audit
  └── assignOwner(id, newOwnerId, userId): void        ← writes audit

SeedService (class)
  ├── constructor(all repos)
  ├── reset(): Promise<void>    ← TRUNCATE all tables + re-seed (deterministic)
  └── seed(): Promise<void>     ← seedrandom with fixed seed, 25+ events

CustomLogger (class)
  ├── info(message, context?)
  ├── warn(message, context?)
  ├── error(message, err?, context?)
  └── debug(message, context?)
```

### Constructor Injection Pattern

Every service receives its dependencies through the constructor. No global imports of repository instances.

```typescript
// Example: EventService depends on repositories + audit service
class EventService {
  constructor(
    private readonly eventRepo: EventRepository,
    private readonly auditService: AuditService,
    private readonly authService: AuthService,
  ) {}
}
```

---

## Database Reference

**File:** `src/server/db/schema.sql` — single DDL, no migration framework. Run once via `psql` or the seed endpoint.

### Tables (5)

#### `users`
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() |
| name | TEXT | NOT NULL |
| email | TEXT | UNIQUE, NOT NULL |
| role | user_role | NOT NULL (enum: operator, manager) |
| created_at | TIMESTAMPTZ | DEFAULT now() |

#### `events`
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() |
| supplier | TEXT | NOT NULL |
| part_asset | TEXT | NOT NULL |
| severity | severity_enum | NOT NULL (critical, high, medium, low) |
| status | event_status_enum | NOT NULL (new, reviewed, escalated, ignored, resolved) |
| summary | TEXT | NOT NULL |
| detected_at | TIMESTAMPTZ | NOT NULL |
| source | TEXT | NOT NULL |
| owner_id | UUID | FK → users(id), NULLABLE |
| recommended_action | TEXT | NULLABLE |
| resolved_at | TIMESTAMPTZ | NULLABLE |
| created_at | TIMESTAMPTZ | DEFAULT now() |
| updated_at | TIMESTAMPTZ | DEFAULT now() |

#### `audit_log` — **APPEND-ONLY, ALL FIELDS IMMUTABLE AFTER INSERT**
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() |
| event_id | UUID | FK → events(id), NOT NULL |
| changed_by | UUID | FK → users(id), NOT NULL |
| action | TEXT | NOT NULL (reviewed, escalated, ignored, resolved, assigned, note_added, etc.) |
| field_changed | TEXT | NULLABLE |
| old_value | TEXT | NULLABLE |
| new_value | TEXT | NULLABLE |
| created_at | TIMESTAMPTZ | DEFAULT now() |

- **No UPDATE endpoint exists.** The repository class has zero update/delete methods.
- **Test:** a test attempts to call a non-existent update path and asserts failure.

#### `notes` — **IMMUTABLE AFTER INSERT**
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() |
| event_id | UUID | FK → events(id), NOT NULL |
| author_id | UUID | FK → users(id), NOT NULL |
| content | TEXT | NOT NULL |
| created_at | TIMESTAMPTZ | DEFAULT now() |

- No update/delete endpoint. No update/delete repository method.

#### `evidence` — **IMMUTABLE AFTER INSERT**
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() |
| event_id | UUID | FK → events(id), NOT NULL |
| title | TEXT | NOT NULL |
| link | TEXT | NULLABLE |
| type | TEXT | NOT NULL (document, link, screenshot) |
| added_by | UUID | FK → users(id), NOT NULL |
| created_at | TIMESTAMPTZ | DEFAULT now() |

- No update/delete endpoint. No update/delete repository method.

### Custom Enums

```sql
CREATE TYPE user_role AS ENUM ('operator', 'manager');
CREATE TYPE severity_enum AS ENUM ('critical', 'high', 'medium', 'low');
CREATE TYPE event_status_enum AS ENUM ('new', 'reviewed', 'escalated', 'ignored', 'resolved');
```

---

## API Route Boundaries

| Method | Path | Role Required | Description |
|--------|------|---------------|-------------|
| `GET` | `/api/events` | Any | List events. Query params: `severity`, `status`, `owner`, `source`, `search`, `sort`, `order`, `page`, `limit` |
| `GET` | `/api/events/[id]` | Any | Single event detail: event + notes[] + evidence[] + auditLog[] |
| `PATCH` | `/api/events/[id]` | Operator+ | Transition status: `{ status: 'reviewed' | 'escalated' | 'ignored' }` |
| `PATCH` | `/api/events/[id]` | **Manager only** | Resolve: `{ status: 'resolved' }` — operator receives **403** |
| `PATCH` | `/api/events/[id]` | Operator+ | Assign owner: `{ owner_id: '<UUID>' }` |
| `POST` | `/api/events/[id]/notes` | Any | Add note: `{ content: '<text>' }` |
| `POST` | `/api/seed` | None (dev only) | Seed: `?reset=true` to TRUNCATE + re-seed |
| `GET` | `/api/healthz` | None | Returns `{ status: 'ok', db: 'connected', timestamp: '...' }` |

### Backend Role Enforcement Flow

```
API route handler
  → AuthService.requireRole('manager')   // checks session.user.role
    → if insufficient → throws ForbiddenError (403)
    → if ok → continues to service layer
```

Role is checked in **every mutation route handler**, not in middleware alone.
The test suite includes an integration test that sends a PATCH resolve request as an operator and asserts `response.status === 403`.

---

## State Machine

```
                         ┌──────────────────┐
                         │      New         │
                         └───────┬──────────┘
                  ┌──────────────┼──────────────────┐
                  ▼              ▼                   ▼
          ┌──────────┐   ┌───────────┐       ┌──────────┐
          │ Reviewed │   │ Escalated │       │ Ignored  │
          └────┬─────┘   └─────┬─────┘       └──────────┘
               │               │                     │
               ▼               ▼                     │
          ┌────────────────────────┐                 │
          │      Resolved           │◄────────────────┘
          │   (manager only)        │   (re-open from ignored)
          └────────────────────────┘
```

### Allowed Transitions (validated in `EventService.transitionStatus()`)

| From | To | Who |
|------|----|------|
| new | reviewed | Operator+ |
| new | escalated | Operator+ |
| new | ignored | Operator+ |
| reviewed | resolved | **Manager only** |
| escalated | resolved | **Manager only** |
| ignored | resolved | **Manager only** |
| ignored | new | Operator+ (re-open) |

Invalid transition → throws `ValidationError(400)`.

---

## Connection Pool (PgBouncer)

### Configuration

```typescript
// src/server/db/connection.ts
import { Pool, PoolConfig } from 'pg';

class ConnectionPool {
  private static instance: ConnectionPool | null = null;
  private pool: Pool;

  private constructor() {
    const config: PoolConfig = {
      connectionString: process.env.DATABASE_URL,
      max: 20,                        // PgBouncer-friendly — keep reasonable
      idleTimeoutMillis: 30_000,      // 30s idle before release
      connectionTimeoutMillis: 5_000, // fail fast (5s)
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
    const result = await this.pool.query(sql, params);
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

### `.env` Variables

```bash
DATABASE_URL=postgresql://user:password@host:6432/coreguard?pgbouncer=true
NEXTAUTH_SECRET=<random-64-char>
NEXTAUTH_URL=http://localhost:3000
SEED_FIXED_SEED=coreguard-seed-2025
```

---

## Authentication & Roles

### NextAuth Config (`src/auth.ts`)

- **Provider:** `CredentialsProvider` with mock login (names from a predefined list)
- **Session strategy:** JWT (no database session storage needed)
- **JWT payload:** `{ sub, name, email, role }`
- **Callback:** `jwt()` enriches token with user role from DB query

### Permission Matrix

| Action | Operator | Manager |
|--------|----------|---------|
| View events | Yes | Yes |
| Filter/search | Yes | Yes |
| Review event | Yes | Yes |
| Escalate event | Yes | Yes |
| Ignore event | Yes | Yes |
| Assign owner | Yes | Yes |
| Add note | Yes | Yes |
| **Resolve event** | **No (403)** | **Yes** |

### Enforcement

- **Backend:** `AuthService.requireRole(role)` called at the top of every API route handler.
- **UI:** Buttons conditionally rendered (`role === 'manager'`), but this is cosmetic — the actual guard is server-side.

---

## Audit Log Design

### Rules

1. **Append-only:** The `audit_log` table has no UPDATE/DELETE triggers or repository methods.
2. **Every mutation writes an audit entry:** status change, owner reassignment, note added → one row in `audit_log`.
3. **Schema guarantee:** `AuditRepository` class exposes `insertEntry()` and `findByEventId()` only. No `update()`, `delete()`, `truncate()` methods.
4. **Test proof:** A Jest test attempts to find an update method on `AuditRepository` using reflection (`Object.getOwnPropertyNames`) and asserts none exist. A second test verifies that updating an `audit_log` row directly via SQL raises a permission error (table has no UPDATE grant for the app user).

### Audit Entry Recorded Fields

```
action: 'status_changed' | 'owner_assigned' | 'note_added'
field_changed: 'status' | 'owner_id' | null
old_value: string | null
new_value: string | null
changed_by: UUID (user who performed the action)
```

---

## Testing Strategy

### File Map

| Test | Tool | What It Proves |
|------|------|----------------|
| `tests/unit/services/event.service.test.ts` | Jest | Status transitions valid/invalid, role checks |
| `tests/unit/services/audit.service.test.ts` | Jest | Append-only: no update/delete exists, write → read integrity |
| `tests/unit/services/seed.service.test.ts` | Jest | Determinism: two resets produce identical 25 events |
| `tests/unit/validators/event.validator.test.ts` | Jest | Zod rejects bad payloads, accepts valid transitions |
| `tests/integration/api/events.test.ts` | Jest | Search, filter, sort, pagination at HTTP level |
| `tests/integration/api/notes.test.ts` | Jest | Note creation + immutability (no PATCH/DELETE route) |
| `tests/integration/auth.test.ts` | Jest | Operator → PATCH resolve returns 403 |
| `tests/integration/audit.test.ts` | Jest | Evidence immutable, audit log append-only via API |
| `tests/integration/healthz.test.ts` | Jest | GET /api/healthz returns 200 + db:connected |
| `tests/e2e/event-workflow.spec.ts` | Playwright | Login → filter critical → view detail → escalate → verify audit |

### Running Tests

```bash
npm test                    # Jest (unit + integration)
npx playwright test         # E2E
npm run test:all            # Both
```

---

## File Size Governance

- **No file exceeds 200 lines of code** (excluding blank lines and import statements).
- Large components are split: e.g. `EventTable.tsx` delegates row rendering to `EventRow.tsx` and filter state to `EventFilters.tsx`.
- Services use constructor injection so logic stays focused.
- Repositories follow the `BaseRepository<T>` abstract class — common `query()` and `queryOne()` methods are inherited, keeping each repository class under 80 lines.

---

## Deployment Architecture

```
┌──────────────────────────────────────────────────┐
│  Vercel (Next.js)                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │ SSR Pages│  │ API Routes│  │ Auth Handler │  │
│  └────┬─────┘  └────┬─────┘  └──────┬───────┘  │
│       │              │               │           │
└───────┼──────────────┼───────────────┼───────────┘
        │              │               │
        ▼              ▼               ▼
┌──────────────────────────────────────────────────┐
│  Supabase (Managed PostgreSQL)                   │
│  ┌──────────────────────────────────────────┐   │
│  │  PgBouncer (:6432)                        │   │
│  │  ┌────┬────┬────┬────┬────┐              │   │
│  │  │ 10 │ 10 │ 10 │ 10 │ 10 │  (pool: 50) │   │
│  │  └────┴────┴────┴────┴────┘              │   │
│  │          │ connection pool               │   │
│  │          ▼                                │   │
│  │  PostgreSQL (:5432)                       │   │
│  │  ┌──────────┐                             │   │
│  │  │ coreguard│  DB with 5 tables           │   │
│  │  └──────────┘                             │   │
│  └──────────────────────────────────────────┘   │
└──────────────────────────────────────────────────┘
```

---

## Key Design Decisions (Tradeoffs)

| Decision | Rationale |
|----------|-----------|
| Raw SQL over ORM | Full control over query plans; no migration framework to learn; simpler for 5 tables |
| OOP with classes | Constructor injection enables easy test mocking; single-responsibility classes stay under 200 LOC |
| PgBouncer (transaction mode) | Serverless-friendly; avoids holding connections open across Vercel cold starts |
| SWR + polling over WebSockets | Assessment explicitly prefers polling that works over real-time that's buggy |
| Mock auth (no OAuth) | Assessment explicitly scopes-out production auth; CredentialsProvider is simpler |
| No migrations | DDL lives in `schema.sql`; run manually or via seed endpoint on DB reset |
| Zod for validation | Runtime type safety; schemas co-located with validators; auto-generates TypeScript types via `z.infer<>` |