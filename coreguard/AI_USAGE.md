# AI Usage — CoreGuard Risk Review Console

## 1. AI Tools Used

| Tool | Model | Purpose |
|------|-------|---------|
| opencode (CLI) | GLM-5.1 (alibaba-cn/glm-5.1) | Full-stack code generation, debugging, refactoring, test writing, documentation |
| Supabase MCP skill | Built-in | Database schema design, connection pooling best practices, PgBouncer configuration |

AI was used as the primary development tool for the entire project. Every file in the codebase was either generated or substantially modified by AI, with human direction provided through conversational prompts in the opencode CLI.

---

## 2. What AI Generated

### Project scaffolding
- `npx create-next-app@latest` with App Router, TypeScript, Tailwind CSS 4
- Project structure: `src/server/`, `src/lib/`, `src/components/`, `src/hooks/`, `src/app/`, `tests/`

### Database layer
- `src/server/db/schema.sql` — full PostgreSQL schema with enums (user_role, severity_enum, event_status_enum), 5 tables (users, events, audit_log, notes, evidence), indexes, and immutability triggers
- `src/server/db/connection.ts` — module-level pg Pool singleton with callback-based query API (to bypass PgBouncer prepared statement caching)
- `src/server/db/repositories/base.repository.ts` — abstract BaseRepository with queryRows, queryOneRow, execute
- `src/server/db/repositories/user.repository.ts` — findByEmail, findById, findByRole, findAll (with explicit SQL type casts)
- `src/server/db/repositories/event.repository.ts` — listEvents with dynamic filters/pagination, findById, updateStatus, assignOwner (all with explicit type casts like $1::uuid, $1::event_status_enum)
- `src/server/db/repositories/audit.repository.ts` — insertEntry, findByEventId only (append-only — no update/delete methods)
- `src/server/db/repositories/note.repository.ts` — create, findByEventId
- `src/server/db/repositories/evidence.repository.ts` — findByEventId only (immutable — no create/update/delete in repository, created via seed only)

### Services layer
- `src/server/services/event.service.ts` — EventService class with transitionStatus (role-gated: manager for resolve, operator+manager for others), assignOwner (role-gated), addNote, listEvents, getEventDetail
- `src/server/services/audit.service.ts` — AuditService class
- `src/server/services/auth.service.ts` — AuthService static class with requireRole (multi-role support), hasRole, getRole
- `src/server/services/seed.service.ts` — SeedService with deterministic seedrandom, reset/seed, bulk insert for users/events/evidence/notes/audit

### Validators
- `src/server/validators/event.validator.ts` — statusUpdateSchema, ownerUpdateSchema, filterQuerySchema (Zod)
- `src/server/validators/note.validator.ts` — createNoteSchema (Zod)
- `src/server/validators/index.ts` — barrel export

### Auth configuration
- `src/auth.ts` — NextAuth v5 CredentialsProvider with authorize() querying UserRepository.findByEmail, JWT strategy, role propagation via callbacks
- `src/app/api/auth/[...nextauth]/route.ts` — NextAuth route handler

### API routes
- `src/app/api/events/route.ts` — GET (list with filters/pagination)
- `src/app/api/events/[id]/route.ts` — GET (detail), PATCH (status transition or owner assignment, auth-only gate, service handles role checks)
- `src/app/api/events/[id]/notes/route.ts` — POST (add note, requires operator or manager)
- `src/app/api/healthz/route.ts` — health check
- `src/app/api/seed/route.ts` — POST seed/reset
- `src/app/api/users/route.ts` — GET users (requires auth)

### UI components
- `src/components/auth/LoginForm.tsx` — mock login UI with hardcoded user list (alice@coreguard.dev, bob@coreguard.dev, carol@coreguard.dev, dan@coreguard.dev), calls next-auth signIn
- `src/components/events/EventActions.tsx` — dynamic action buttons derived from ALLOWED_TRANSITIONS[currentStatus], manager-only resolve, operator+manager for review/escalate/ignore
- `src/components/events/EventDetailPanel.tsx` — event detail display
- `src/components/events/EventTimeline.tsx` — audit timeline display
- `src/components/events/EventFilters.tsx` — filter sidebar (severity, status, source, search)
- `src/components/events/EventTable.tsx` — paginated event table
- `src/components/events/EventRow.tsx` — single event row
- `src/components/events/AssignOwner.tsx` — owner assignment dropdown
- `src/components/events/NotesList.tsx` — notes display
- `src/components/events/AddNoteForm.tsx` — note creation form
- `src/components/events/EvidenceList.tsx` — evidence display
- `src/components/dashboard/SummaryCards.tsx` — dashboard summary cards
- `src/components/ui/Card.tsx`, `Button.tsx`, `Badge.tsx`, `Spinner.tsx`, `ErrorBanner.tsx`, `Select.tsx`, `Input.tsx`, `EmptyState.tsx` — reusable UI primitives

### Hooks
- `src/hooks/useAuth.ts` — next-auth session hook with role helpers (isOperator, isManager)
- `src/hooks/useEventDetail.ts` — SWR-based event detail fetcher
- `src/hooks/useEvents.ts` — SWR-based event list fetcher with polling
- `src/hooks/useFilters.ts` — URL-based filter state management
- `src/hooks/usePolling.ts` — polling interval hook

### Pages
- `src/app/(console)/layout.tsx` — server component auth guard (redirects to /login if no session)
- `src/app/(console)/dashboard/page.tsx` — dashboard page
- `src/app/(console)/events/page.tsx` — events list page
- `src/app/(console)/events/[id]/page.tsx` — event detail page with status actions, owner assignment, notes, evidence, audit timeline
- `src/app/login/page.tsx` — login page with LoginForm
- `src/app/page.tsx` — root redirect to /dashboard

### Constants and types
- `src/lib/constants.ts` — ALLOWED_TRANSITIONS (new→[reviewed,escalated,ignored], reviewed→[resolved,ignored], escalated→[resolved,ignored], ignored→[resolved,new], resolved→[]), SEVERITIES, EVENT_STATUSES, SOURCES, USER_ROLES, pagination defaults
- `src/lib/errors.ts` — AppError, ValidationError, ForbiddenError (403), UnauthorizedError (401), NotFoundError (404)
- `src/lib/api-response.ts` — ApiResponse static helpers (success, created, error, internalError)
- `src/lib/logger.ts` — single shared pino instance with .child() pattern
- `src/lib/utils.ts` — cn() utility for Tailwind class merging
- `src/types/index.ts` — TypeScript interfaces for all domain entities

### Tests (47 total, all passing)
- `tests/unit/services/auth.service.test.ts` — role boundary tests (UnauthorizedError for null session, ForbiddenError for operator→manager, role checks pass)
- `tests/unit/services/event.service.test.ts` — transition map validation (9 valid transitions, 6 invalid, resolved terminal, covers all statuses including reviewed→ignored and escalated→ignored)
- `tests/unit/services/audit.service.test.ts` — audit service unit tests
- `tests/unit/services/seed.service.test.ts` — seed service unit tests
- `tests/unit/validators/event.validator.test.ts` — Zod validator tests
- `tests/integration/healthz.test.ts` — health endpoint test
- `tests/integration/permissions.test.ts` — comprehensive permission boundary tests:
  - Operator receives 403 on resolve (ForbiddenError with statusCode 403)
  - Manager can resolve
  - Operator can review, escalate, ignore, assign, comment
  - Manager can add notes
  - AuditRepository has only 2 methods (insertEntry, findByEventId) — no update/delete
  - EvidenceRepository has only 1 method (findByEventId) — no create/update/delete
  - Schema.sql contains immutability triggers (prevent_audit_modification, prevent_evidence_modification)
  - Audit rows record who/what/when (changed_by, action, field_changed, old_value, new_value, created_at)

### Database-level constraints
- Triggers on `audit_log` blocking UPDATE and DELETE (raise exception 'audit_log is append-only: modification not allowed')
- Triggers on `evidence` blocking UPDATE and DELETE (raise exception 'evidence is immutable after creation: modification not allowed')
- Both triggers verified working on live Supabase database

---

## 3. How AI Outputs Were Validated

### Build verification
Every change was validated with:
- `npx tsc --noEmit` — TypeScript type checking
- `npm run build` — Next.js production build (all routes compile, static pages generate)
- `npm test` — Jest test suite (47/47 passing)

### Runtime verification
- Dev server started and tested via HTTP requests
- Seed endpoint (`POST /api/seed`) tested and confirmed working
- Auth flow tested via NextAuth CSRF + credentials sign-in (Node.js fetch script)
- Status transitions tested end-to-end: ignored→new (200), new→reviewed (200), reviewed→escalated (400 blocked), reviewed→resolved via manager (success)
- DB triggers verified on live Supabase: UPDATE on audit_log blocked, DELETE on audit_log blocked, UPDATE on evidence blocked, DELETE on evidence blocked

### Error diagnosis and resolution
Multiple runtime errors were encountered and resolved by AI through systematic debugging:

1. **MaxListenersExceededWarning** — caused by multiple pino instances per module. Fixed by refactoring to single shared logger with `.child()` pattern.

2. **Edge Runtime crypto error** — `src/middleware.ts` used next-auth which requires Node.js crypto module. Fixed by deleting middleware.ts and moving auth guard to `(console)/layout.tsx` server component. Key learning: Next.js middleware runs in Edge Runtime regardless of `export const runtime = 'nodejs'`.

3. **PostgreSQL "inconsistent types deduced for parameter $1"** — PgBouncer in transaction mode caches prepared statements per connection, causing type conflicts when `$1` is used as different types (uuid vs text vs enum) across different queries on the same pooled connection. Multiple fix attempts:
   - First attempt: `statement_cache: { max: 0 }` on Pool config — failed because pg PoolConfig types don't expose this property
   - Second attempt: callback-based pg API (`pool.query(sql, params, callback)`) to use Simple Query Protocol — didn't fix the issue (pg still uses extended protocol internally)
   - Final fix: explicit SQL type casts on all parameterized queries (`$1::uuid`, `$1::event_status_enum`, `$1::text`, `$1::severity_enum`, `$1::timestamptz`, `$1::user_role`, etc.) — this resolved the PgBouncer type inference conflict

4. **"Cannot transition from ignored to reviewed"** — EventActions component showed hardcoded buttons (Review, Escalate, Ignore) for all non-resolved statuses, but ALLOWED_TRANSITIONS only allowed ignored→[resolved, new]. Fixed by making EventActions derive buttons from ALLOWED_TRANSITIONS[currentStatus].

5. **Manager 403 on resolve** — PATCH route had `AuthService.requireRole(session, 'operator')` as blanket gate, blocking managers before the service's `requireRole(session, 'manager')` for resolve could execute. Fixed by removing blanket operator-only gate and letting service handle role-specific checks.

6. **"Ignore" not showing in UI** — ALLOWED_TRANSITIONS didn't allow reviewed→ignored or escalated→ignored. Business logic requires that reviewed and escalated events can also be ignored. Fixed by adding these transitions.

7. **Manager unable to add notes** — Notes route had `requireRole(session, 'operator')` blocking managers. Fixed by changing to `requireRole(session, 'operator', 'manager')`.

---

## 4. What the Human Modified After AI Generation

The human provided direction and reviewed outputs through conversational prompts. Key human decisions that shaped the codebase:

- **Technology choices**: Specified Next.js 15 (App Router), Tailwind CSS 4, Supabase/PostgreSQL, NextAuth v5, raw SQL (no ORM), OOP TypeScript, Jest + Playwright
- **Connection pool refactor**: Directed AI to switch from class-based singleton to module-level variable after Next.js module scoping issues
- **Logger refactor**: Directed AI to switch from per-module pino instances to single shared instance after MaxListenersExceededWarning
- **Middleware removal**: Directed AI to delete middleware.ts after Edge Runtime crypto error
- **Login UI preference**: Specified that LoginForm should use hardcoded mock user emails for convenience, but authorize() must still query the database
- **Auth cookie propagation**: Directed AI to add `credentials: 'include'` to all client-side fetch calls
- **Supabase connection**: Provided connection string with PgBouncer transaction pooler (port 6543, IPv4)
- **Bug reports**: Reported runtime errors ("inconsistent types", "Cannot transition from ignored to reviewed", manager unable to add notes, ignore not showing) which AI then diagnosed and fixed
- **Permission requirements**: Reviewed assessment spec requirements 4 and 5, identified gaps (no audit append-only test, no evidence immutability test, no operator 403 on resolve test, missing role gates on assignOwner), directed AI to fix all gaps
- **AI_USAGE.md creation**: Directed AI to create this document with full conversation history

- **Permission requirements review**: Human reviewed assessment spec requirements 4 and 5, identified gaps (no audit append-only test, no evidence immutability test, no operator 403 on resolve test, missing role gates on assignOwner), directed AI to fix all gaps
- **Bug reports**: Human reported runtime errors ("inconsistent types", "Cannot transition from ignored to reviewed", manager unable to add notes, ignore not showing) which AI diagnosed and fixed