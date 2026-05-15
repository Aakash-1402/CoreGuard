# CoreGuard — Risk Review Console

> A full-stack web application for security/operations teams to inspect incoming risk events, review supporting evidence, assign ownership, take action, and audit every change.

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Tech Stack & Justification](#2-tech-stack--justification)
3. [Local Setup & Run Commands](#3-local-setup--run-commands)
4. [Test Command & Results](#4-test-command--results)
5. [Seed / Reset Command](#5-seed--reset-command)
6. [Deploy Log](#6-deploy-log)
7. [Threat Model](#7-threat-model)
8. [Data Model Summary](#8-data-model-summary)
9. [API Boundaries](#9-api-boundaries)
10. [Permissions Enforcement](#10-permissions-enforcement)
11. [State Changes & Audit Persistence](#11-state-changes--audit-persistence)
12. [Known Gaps & Next Steps](#12-known-gaps--next-steps)

---

## 1. Product Overview

CoreGuard's Risk Review Console provides operators and managers with a unified interface to triage risk events from the supply chain. Operators can filter, search, and inspect events, view evidence, add internal notes, escalate items, and assign owners. Managers have the additional authority to resolve events. Every mutation is recorded in an append-only audit log, creating a complete, immutable history.

### Core Features

- **Risk event queue:** 25+ deterministic seeded events with sort, filter, and search
- **Event detail:** Timeline, evidence items, notes thread, recommended next action
- **Actions:** Review, escalate, ignore, resolve (manager-only), assign owner, add notes
- **Audit trail:** Append-only log records who changed what and when
- **Auth:** Mock login with two roles (operator / manager), enforced server-side
- **Refresh:** Configurable polling with manual refresh button

---

## 2. Tech Stack & Justification

| Technology | Purpose | Why |
|-----------|---------|-----|
| **Next.js 15** (App Router) | Full-stack framework | Server components reduce client JS; API routes co-locate backend logic; Vercel-native deployment |
| **Tailwind CSS 4** | Styling | Utility-first, zero-runtime CSS; rapid prototyping; no context-switching between files |
| **NextAuth.js v5** | Authentication | First-class Next.js integration; JWT-based sessions; lightweight mock provider support |
| **PostgreSQL + PgBouncer** | Database | ACID compliance for audit data; PgBouncer enables connection pooling for serverless cold starts |
| **Raw SQL (pg)** | DB client | No ORM overhead; full control over queries; simpler for 5-table schema |
| **Zod** | Validation | Runtime type-safety on all server inputs; inferred types keep DTOs DRY |
| **Jest + Playwright** | Testing | Jest for fast unit/integration tests; Playwright for real browser E2E |
| **Pino** | Logging | Structured JSON logs; minimal overhead; easy integration with log aggregators |

---

## 3. Local Setup & Run Commands

### Prerequisites

- Node.js 20+
- PostgreSQL 16+ (or Supabase project)
- npm

### Setup

```bash
# 1. Clone the repository
git clone <repo-url>
cd coreguard

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env.local
# Edit .env.local with your DATABASE_URL and NEXTAUTH_SECRET

# 4. Initialize database schema (single DDL file)
psql $DATABASE_URL -f src/server/db/schema.sql

# 5. Seed the database (25 deterministic events)
curl -X POST http://localhost:3000/api/seed

# 6. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in as any predefined user.

### Mock Users (pre-seeded)

| Name | Email | Role |
|------|-------|------|
| Alice Operator | alice@coreguard.dev | operator |
| Bob Operator | bob@coreguard.dev | operator |
| Carol Manager | carol@coreguard.dev | manager |
| Dan Manager | dan@coreguard.dev | manager |

**Password (any user):** `password` (mock auth — any non-empty string works)

---

## 4. Test Command & Results

```bash
# Run all unit + integration tests
npm test

# Run E2E tests
npx playwright test

# Run everything
npm run test:all
```

### Current Test Count & Status

| Suite | Tests | Passing | Description |
|-------|-------|---------|-------------|
| `event.service.test.ts` | 5 | 5/5 | Valid transitions, invalid transition rejection, manager-only resolve |
| `audit.service.test.ts` | 2 | 2/2 | AuditRepository has no update/delete methods; append integrity |
| `seed.service.test.ts` | 1 | 1/1 | Two resets produce identical 25 events |
| `event.validator.test.ts` | 3 | 3/3 | Bad payload rejection, valid payload acceptance |
| `auth.test.ts` | 2 | 2/2 | Operator → resolve = 403; Manager → resolve = 200 |
| `audit.test.ts` | 2 | 2/2 | Evidence immutable; audit entries append-only via API |
| `events.test.ts` | 3 | 3/3 | Filter by severity, search, pagination |
| `notes.test.ts` | 1 | 1/1 | Note creation + verification |
| `healthz.test.ts` | 1 | 1/1 | GET /api/healthz returns ok |
| `event-workflow.spec.ts` | 1 | 1/1 | E2E: login → filter → view → escalate → verify audit |
| **Total** | **21** | **21/21** | |

---

## 5. Seed / Reset Command

### Seed (first time)

```bash
curl -X POST http://localhost:3000/api/seed
```

### Reset (destroy + re-seed)

```bash
curl -X POST http://localhost:3000/api/seed?reset=true
```

### Determinism Guarantee

The seed uses a fixed pseudo-random seed (`SEED_FIXED_SEED` env var). Two consecutive resets produce **byte-identical** data. Verified by `seed.service.test.ts`.

### What Gets Seeded

- 4 mock users (2 operators, 2 managers)
- 25 risk events spanning all severities (critical/high/medium/low), statuses, suppliers, and sources
- Mixed evidence items (2+ on at least one event)
- Mixed notes (multiple notes on at least one event)
- Sample audit log entries showing status history on at least one event

---

## 6. Deploy Log

### Environment Variables

| Variable | Where It Lives | Purpose |
|----------|---------------|---------|
| `DATABASE_URL` | Vercel env vars | PostgreSQL connection string (with `?pgbouncer=true`) |
| `NEXTAUTH_SECRET` | Vercel env vars | JWT signing secret (64-char random) |
| `NEXTAUTH_URL` | Vercel env vars | Deployed app URL (e.g. `https://coreguard.vercel.app`) |
| `SEED_FIXED_SEED` | Vercel env vars | Fixed seed for deterministic data generation |

### Deploy Steps

1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy
5. Initialize database: `psql $DATABASE_URL -f src/server/db/schema.sql`
6. Seed: `curl -X POST https://<deployed-url>/api/seed`

### What Broke During Deploy & Fix

| Issue | Fix |
|-------|-----|
| `Edge runtime does not support pg` | Ensure API routes use `nodejs` runtime (`export const runtime = 'nodejs'`) |
| PgBouncer `prepared statement` errors | Added `?pgbouncer=true` to DATABASE_URL; set `statement_timeout=0` |
| NextAuth `NEXTAUTH_URL` missing | Set to deployed URL in Vercel env vars |
| Cold start timeouts on first query | Increased `connectionTimeoutMillis` to 10s; PgBouncer keeps pool warm |

### Smoke Test (against deployed URL)

```bash
# Health check
curl https://<deployed-url>/api/healthz
# → {"status":"ok","db":"connected","timestamp":"2026-05-15T12:00:00.000Z"}

# Seed (one-time, protected by env check in production)
curl -X POST https://<deployed-url>/api/seed

# List events as authenticated user
curl https://<deployed-url>/api/events \
  -H "Cookie: next-auth.session-token=<token>"
```

---

## 7. Threat Model

### Scenario 1 — Malicious Operator Mass-Resolves Events

**Abuse:** An operator, either malicious or compromised, writes a script that calls the resolve endpoint for all unresolved events, hiding critical risks from the team.

**Prevention & Detection:**
- **Prevention:** Backend enforces role check — PATCH `/api/events/[id]` with `status=resolved` checks `AuthService.requireRole('manager')`. Operators receive 403 before any DB mutation occurs.
- **Detection:** Audit log records every resolve action with `changed_by`. A periodic query for unusual resolve velocity (e.g., >5 resolves in 60 seconds by one user) would flag this.

**Status:** Prevention implemented (role guard). Detection (velocity alert) deferred.

### Scenario 2 — Compromised Account Tamperes Audit Trail

**Abuse:** An attacker with valid credentials attempts to delete or modify audit log entries to cover their tracks after a malicious action.

**Prevention & Detection:**
- **Prevention:** The `AuditRepository` class has no `update()`, `delete()`, or `truncate()` methods. The database user used by the application has only `INSERT` and `SELECT` grants on `audit_log` — no `UPDATE` or `DELETE` privileges. Even if an attacker bypasses the application to run raw SQL, `UPDATE audit_log SET ...` will fail with a permission error.
- **Detection:** A database-level trigger logs any permission-denied attempt to a separate monitoring log.

**Status:** Prevention implemented (class-level + DB privilege restriction). DB trigger monitoring deferred.

### Scenario 3 — Seed Endpoint Exposed in Production

**Abuse:** The `/api/seed` endpoint, if left unprotected, allows anyone to wipe all data and re-seed, destroying real audit records and production event state.

**Prevention & Detection:**
- **Prevention:** The seed endpoint checks `process.env.ALLOW_SEED === 'true'` before executing. In production, this env var is not set, so the endpoint returns 404. The route handler is wrapped in a guard that short-circuits in non-dev environments.
- **Detection:** Any 200 response from `/api/seed` in production triggers an alert via log monitoring.

**Status:** Prevention implemented (env guard). Production alerting deferred.

---

## 8. Data Model Summary

### Entities & Relationships

```
users 1─────< events (owner_id)      ← one owner per event, optional
events 1─────< audit_log (event_id)  ← one event has many audit entries
events 1─────< notes (event_id)      ← one event has many notes
events 1─────< evidence (event_id)   ← one event has many evidence items
users 1─────< audit_log (changed_by) ← one user has many audit entries
users 1─────< notes (author_id)      ← one user authors many notes
users 1─────< evidence (added_by)    ← one user adds many evidence items
```

### Immutable Fields

| Table | Status |
|-------|--------|
| `audit_log` | **Entire row is immutable** — no UPDATE/DELETE grants; no repository methods |
| `notes` | **All columns immutable after INSERT** — no update/delete repository methods |
| `evidence` | **All columns immutable after INSERT** — `title` and `link` cannot be edited |

### Mutable Fields

| Table | Mutable Fields |
|-------|---------------|
| `events` | `status`, `owner_id`, `resolved_at`, `updated_at` — changed only via `transitionStatus()` and `assignOwner()` |
| `users` | None (mock auth — seeded once) |

---

## 9. API Boundaries

| Method | Path | Role | Description | Request Body / Query |
|--------|------|------|-------------|---------------------|
| `GET` | `/api/events` | Any | List risk events | `?severity=critical&status=new&owner=<id>&source=sap&search=bearing&sort=detected_at&order=desc&page=1&limit=20` |
| `GET` | `/api/events/[id]` | Any | Event detail + notes + evidence + audit timeline | — |
| `PATCH` | `/api/events/[id]` | Operator+ | Transition status | `{ "status": "reviewed" }` |
| `PATCH` | `/api/events/[id]` | **Manager** | Resolve event | `{ "status": "resolved" }` |
| `PATCH` | `/api/events/[id]` | Operator+ | Assign owner | `{ "owner_id": "<UUID>" }` |
| `POST` | `/api/events/[id]/notes` | Any | Add note | `{ "content": "Investigated supplier backlog" }` |
| `POST` | `/api/seed` | None* | Seed database | `?reset=true` (optional) |

*Seed endpoint: Only available when `ALLOW_SEED=true` environment variable is set (development only).

### Standard Response Envelope

```json
// Success
{ "data": { ... }, "meta": { "page": 1, "total": 25 } }

// Error
{ "error": { "code": "FORBIDDEN", "message": "Resolve requires manager role" } }
```

---

## 10. Permissions Enforcement

### Backend (Authoritative)

Every API route handler calls `AuthService.requireRole()` before any mutation:

```typescript
// src/app/api/events/[id]/route.ts (PATCH handler)
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authConfig);
  const body = await req.json();

  if (body.status === 'resolved') {
    AuthService.requireRole(session, 'manager'); // ← throws ForbiddenError if operator
  } else {
    AuthService.requireRole(session, 'operator'); // authenticated users only
  }

  // ... validation, service call, audit write
}
```

### UI (Cosmetic Only)

Components check the session role to show/hide buttons:

```tsx
{user?.role === 'manager' && (
  <Button onClick={resolveEvent}>Resolve</Button>
)}
```

Removing this button from the DOM is not a security measure — the backend is the gate.

### Test Proof

`tests/integration/auth.test.ts`:
- Log in as operator
- Send `PATCH /api/events/<id>` with `{ status: 'resolved' }`
- Assert: `response.status === 403`
- Assert: `response.body.error.code === 'FORBIDDEN'`

---

## 11. State Changes & Audit Persistence

### How a State Change Flows

```
1. User clicks "Escalate" in UI
2. UI → PATCH /api/events/[id] { status: 'escalated' }
3. Route handler:
   a. Validates session (getServerSession)
   b. Checks role (AuthService.requireRole)
   c. Validates payload (EventValidator)
   d. Calls EventService.transitionStatus(id, 'escalated', userId)
4. EventService.transitionStatus():
   a. Reads current event from EventRepository
   b. Validates transition is allowed (state machine)
   c. Updates event status in EventRepository
   d. Calls AuditService.record(id, userId, 'escalated', 'status', oldValue, 'escalated')
5. AuditService.record():
   a. Calls AuditRepository.insertEntry(...) ← one INSERT, no UPDATE path
6. Response: { data: { ...updatedEvent, audit: newEntry } }
```

### Audit Row Example

```json
{
  "id": "a1b2c3d4-...",
  "event_id": "e5f6g7h8-...",
  "changed_by": "u9i0j1k2-...",
  "action": "status_changed",
  "field_changed": "status",
  "old_value": "new",
  "new_value": "escalated",
  "created_at": "2026-05-15T10:30:00.000Z"
}
```

---

## 12. Known Gaps & Next Steps

### Gaps

| Gap | File(s) | Impact | What I'd Do Next |
|-----|---------|--------|-----------------|
| No real auth | `src/auth.ts`, `src/app/(auth)/login/page.tsx` | Anyone can log in as any user | Add OAuth provider (GitHub/Google) via NextAuth, remove CredentialsProvider |
| Polling wastes requests | `src/hooks/usePolling.ts` | Unnecessary network calls when no changes | Add ETag/Last-Modified headers; poll only when tab is active |
| No input sanitization on search | `src/server/validators/filter.validator.ts` | Potential for SQL-like injection in free-text search | Add character whitelist; parameterize all queries (already done, but add explicit regex allowlist) |
| Seed endpoint in production is env-gated only | `src/app/api/seed/route.ts` | Misconfigured env exposes wipe capability | Add a cryptographically signed admin token requirement |
| No rate limiting on mutations | `src/app/api/events/[id]/route.ts` | An operator could script rapid status changes | Add Vercel KV-backed rate limiter: 10 mutations/minute per user |
| Test coverage: no edge case for concurrent status updates | `tests/unit/services/event.service.test.ts` | Two users escalating simultaneously could race | Add optimistic locking with `updated_at` version check |
| Dashboard is optional/not scored | `src/app/(console)/dashboard/page.tsx` | Summary metrics would improve operator workflow | Build KPI cards: open critical count, by-status breakdown, avg time since detection |
| No mobile responsiveness | All components | Unusable on phones | Add responsive breakpoints for the event table (stack rows, hide columns) |

### Files to Refactor First

1. **`src/server/services/event.service.ts`** — currently the largest service; split `transitionStatus()` into its own `StatusTransitionService` class
2. **`src/components/events/EventTable.tsx`** — add virtual scrolling for large datasets
3. **`src/app/api/events/route.ts`** — extract filter parsing to `FilterValidator` to remove inline query-string logic

---

## Appendix: Useful Commands

```bash
# Local development
npm run dev                 # Start Next.js dev server
npm run build               # Production build
npm run start               # Start production server

# Testing
npm test                    # Jest (unit + integration)
npx playwright test         # Playwright E2E

# Database
npm run db:init             # Run schema.sql against DATABASE_URL
curl -X POST localhost:3000/api/seed        # Seed
curl -X POST localhost:3000/api/seed?reset=true  # Reset + seed

# Production smoke test
curl https://coreguard.vercel.app/api/healthz
```#   C o r e G u a r d  
 