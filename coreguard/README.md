# CoreGuard — Risk Review Console

A full-stack web application for security and operations teams to triage supply-chain risk events, review evidence, assign ownership, take action, and audit every change.

---

## Quick Start

```bash
cd coreguard
npm install
cp .env.example .env.local          # set DATABASE_URL and NEXTAUTH_SECRET
psql $DATABASE_URL -f src/server/db/schema.sql
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Mock Users

| Name | Email | Role |
|------|-------|------|
| Alice Operator | alice@coreguard.dev | operator |
| Bob Operator | bob@coreguard.dev | operator |
| Carol Manager | carol@coreguard.dev | manager |
| Dan Manager | dan@coreguard.dev | manager |

Any password works. Authentication is mock (NextAuth CredentialsProvider).

---

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| Next.js 16 (App Router) | Full-stack framework |
| TypeScript | Type safety |
| Tailwind CSS 4 | Styling |
| NextAuth v5 | Authentication |
| PostgreSQL + pg | Database (raw SQL, no ORM) |
| Zod | Input validation |
| SWR | Client-side data fetching with polling |
| Pino | Structured logging |
| Jest | Unit & integration tests |
| Playwright | E2E tests (Page Object Model) |

---

## Features

- **Risk event queue** — 25+ seeded events with sort, filter, search, and pagination
- **Event detail** — Audit timeline, evidence items, notes thread, recommended action
- **Role-based actions** — Operators can review/escalate/ignore; Managers can additionally resolve
- **Owner assignment** — Assign any user as event owner
- **Notes** — Add internal notes to events
- **Audit trail** — Append-only log records every mutation (who, what, when)
- **Dashboard** — Summary cards: Total Events, Open (new+reviewed+escalated+ignored), Resolved, Pages
- **Reset 50% to New** — Button to randomly reset half of non-new events back to `new` status
- **Auto-refresh** — Configurable polling (30s) with manual refresh button

---

## Scripts

```bash
npm run dev           # Start dev server
npm run build         # Production build
npm run start         # Start production server
npm run lint          # ESLint

npm test              # Jest unit + integration tests
npm run test:e2e      # Playwright E2E tests
npm run test:all      # Jest + Playwright

npm run db:init       # Run schema.sql
npm run seed          # Seed database (curl POST /api/seed)
```

---

## E2E Tests (Playwright)

**35 tests — all passing**

```
tests/e2e/
├── fixtures/
│   ├── common.data.ts       # Shared: users, severities, statuses, sources, search terms
│   ├── manager.data.ts      # Manager role data (Carol, visible actions incl. Resolve)
│   └── operator.data.ts     # Operator role data (Alice, visible actions excl. Resolve)
├── pages/
│   ├── LoginPage.ts          # Login, user selection, authentication
│   ├── EventsPage.ts         # Filters, search, pagination, sort, navigation
│   ├── EventDetailPage.ts    # Status actions, notes, owner, audit/evidence
│   └── DashboardPage.ts      # Summary cards, navigation
├── manager.spec.ts           # 15 tests — manager scenario
├── operator.spec.ts          # 15 tests — operator scenario
└── event-workflow.spec.ts    # 4 tests — basic workflow
```

### Manager Scenario (15 tests)
Login, events listing, filter by severity/status/source, search, clear filters, navigate dashboard, open event detail, verify action buttons (incl. Resolve), review event, resolve event, add note, view audit/evidence, paginate, refresh, verify all users on login.

### Operator Scenario (15 tests)
Login, events listing, filter by severity/status/source, search, clear filters, navigate dashboard, verify Resolve button is **hidden** on reviewed/escalated events, review event (cannot resolve), escalate event, add note, view audit/evidence, paginate, refresh, verify all users on login.

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/events` | List events (filters via query params) |
| `GET` | `/api/events/[id]` | Event detail + notes + evidence + audit |
| `PATCH` | `/api/events/[id]` | Update status or assign owner |
| `POST` | `/api/events/[id]/notes` | Add a note |
| `POST` | `/api/events/reset` | Reset 50% of non-new events to `new` |
| `GET` | `/api/users` | List all users |
| `GET` | `/api/healthz` | Health check |
| `POST` | `/api/seed` | Seed/reset database |

---

## Permissions

| Action | Operator | Manager |
|--------|----------|---------|
| View events | Yes | Yes |
| Review (new → reviewed) | Yes | Yes |
| Escalate (new → escalated) | Yes | Yes |
| Ignore (any → ignored) | Yes | Yes |
| Resolve (reviewed/escalated → resolved) | **No** | Yes |
| Assign owner | Yes | Yes |
| Add notes | Yes | Yes |

Enforced server-side in `EventService.transitionStatus()`. UI hides buttons cosmetically; backend is authoritative.

---

## State Transitions

```
new → reviewed, escalated, ignored
reviewed → resolved (manager only), ignored
escalated → resolved (manager only), ignored
ignored → resolved (manager only), new
resolved → (terminal)
```

---

## Database Schema

```
users (id, name, email, role)
events (id, supplier, part_asset, severity, status, summary, detected_at, source, owner_id, recommended_action, resolved_at)
audit_log (id, event_id, changed_by, action, field_changed, old_value, new_value)
notes (id, event_id, author_id, content)
evidence (id, event_id, title, link, type, added_by)
```

Audit log, notes, and evidence are **append-only** — no UPDATE/DELETE repository methods exist.

---

## Project Structure

```
coreguard/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/login/       # Login page
│   │   ├── (console)/          # Authenticated layout
│   │   │   ├── events/         # Events list + detail pages
│   │   │   └── dashboard/      # Dashboard page
│   │   └── api/                # API routes
│   ├── components/             # React components
│   │   ├── auth/               # LoginForm
│   │   ├── events/             # EventTable, EventRow, EventFilters, EventActions, etc.
│   │   ├── dashboard/          # SummaryCards
│   │   ├── layout/             # Sidebar, Header, ConsoleShell
│   │   └── ui/                 # Button, Card, Badge, Input, Select, etc.
│   ├── hooks/                  # useAuth, useEvents, useEventDetail, useFilters, usePolling
│   ├── lib/                    # constants, utils, api-response, errors, logger
│   ├── server/
│   │   ├── db/                 # connection, repositories (event, audit, note, evidence, user)
│   │   ├── services/           # event.service, audit.service, auth.service, seed.service
│   │   └── validators/         # event.validator, note.validator
│   └── types/                  # TypeScript interfaces (event, user, note, evidence, audit, api)
├── tests/
│   ├── e2e/                    # Playwright E2E (Page Object Model)
│   ├── integration/            # Jest integration tests
│   └── unit/                   # Jest unit tests
└── playwright.config.ts
```
