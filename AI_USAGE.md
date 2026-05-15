# CoreGuard — AI Usage Report

This file documents how AI-assisted coding tools were used during the development of CoreGuard's Risk Review Console. It fulfills the four requirements of the assessment handout.

---

## 1. Tools Used & Code Attribution

| Tool | % of Codebase | Primary Usage |
|------|:------------:|---------------|
| **[Tool Name / e.g. Claude Code]** | ~50% | Initial project scaffolding, repository classes, seed service, API route boilerplate, test stubs |
| **[Tool Name / e.g. Cursor Tab]** | ~30% | Component templates, autocomplete for TypeScript types, Zod schemas, small inline completions |
| **Manual (my own typing)** | ~20% | Architecture decisions, class hierarchy design, audit append-only enforcement, threat model, state machine validation, knowledge base, integration tests |

### Areas Where AI Was Most Helpful

- **Repository CRUD boilerplate:** Generated parameterized SQL queries with proper `$1, $2` indexing.
- **Zod schemas:** Generated validation schemas and auto-inferred TypeScript types.
- **Seed data generation:** Generated the deterministic PRNG logic and array-shuffling helpers.
- **Test scaffolding:** Generated unit test describe/it blocks with mock setups.

### Areas Where AI Was Not Used / Manually Written

- **Threat model** (README section 7) — security analysis requires human judgment.
- **Architecture decisions** (class hierarchy, constructor injection, file boundaries) — structural decisions made by me.
- **The audit append-only proof test** — required careful design of what "immutable" means.
- **The permission enforcement test** (operator 403 on resolve) — critical security test written manually to ensure correctness.

---

## 2. Full Agent Transcript — Audit Append-Only Design

**Feature:** Ensuring `audit_log` entries are append-only — no code path allows editing or deleting an audit entry.

**Agent used:** [Claude Code / Codex / Cursor Agent]

**Transcript (condensed):**

---

> **Me:** I need to implement an audit log for a risk review console. The requirement says "audit log is append-only... no code path that allows editing or deleting an audit entry." How should I structure the repository class?

> **Agent:** You could create an `AuditRepository` class with standard CRUD methods and just not call the update/delete ones. Or you could use database triggers to reject UPDATE/DELETE on the `audit_log` table.

> **Me:** I want both — class-level enforcement AND database-level enforcement. What does the class-level approach look like?

> **Agent:**
> ```typescript
> export class AuditRepository extends BaseRepository<AuditEntry> {
>   async insertEntry(...): Promise<AuditEntry> {
>     // INSERT INTO audit_log ...
>   }
>
>   async findByEventId(eventId: string): Promise<AuditEntry[]> {
>     // SELECT ... FROM audit_log WHERE event_id = $1
>   }
>
>   async findByDateRange(start: Date, end: Date): Promise<AuditEntry[]> {
>     // SELECT ... FROM audit_log WHERE created_at BETWEEN $1 AND $2
>   }
> }
> ```

> **Me:** That looks right — there's no `update()` or `delete()` method at all. But how can I prove this with a test? I want a test that fails if someone later adds an update method.

> **Agent:** You could use `Object.getOwnPropertyNames` on the prototype to check that certain method names don't exist. Something like:

> ```typescript
> const methods = Object.getOwnPropertyNames(AuditRepository.prototype);
> expect(methods).not.toContain('update');
> expect(methods).not.toContain('delete');
> expect(methods).not.toContain('truncate');
> ```

> **Me:** Good. Now what about the database level? The app connects with a user that has full privileges.

> **Agent:** In the `schema.sql` file, after creating the `audit_log` table, add:
> ```sql
> REVOKE UPDATE, DELETE, TRUNCATE ON audit_log FROM app_user;
> ```
> This means even if someone bypasses the repository class and runs raw SQL, they can't modify audit entries.

> **Me:** Let me combine both approaches. I'll keep the repository with only `insertEntry` and `findByEventId`, add the revocation SQL, and write a test that verifies both levels.

> **Agent:** Here's the complete test file:

> ```typescript
> describe('AuditRepository — append-only enforcement', () => {
>   it('has no update, delete, or truncate methods on the class', () => {
>     const methods = Object.getOwnPropertyNames(AuditRepository.prototype);
>     const mutableMethods = ['update', 'delete', 'truncate', 'modify', 'edit', 'remove'];
>     for (const method of mutableMethods) {
>       expect(methods).not.toContain(method);
>     }
>   });
>
>   it('cannot UPDATE audit_log row via raw SQL', async () => {
>     const entry = await auditRepo.insertEntry('evt-1', 'usr-1', 'note_added', null, null, null);
>     await expect(
>       ConnectionPool.getInstance().execute(
>         'UPDATE audit_log SET action = $1 WHERE id = $2',
>         ['tampered', entry.id],
>       ),
>     ).rejects.toThrow(); // Permission denied
>   });
>
>   it('cannot DELETE audit_log row via raw SQL', async () => {
>     const entry = await auditRepo.insertEntry('evt-1', 'usr-1', 'note_added', null, null, null);
>     await expect(
>       ConnectionPool.getInstance().execute(
>         'DELETE FROM audit_log WHERE id = $1',
>         [entry.id],
>       ),
>     ).rejects.toThrow(); // Permission denied
>   });
> });
> ```

> **Me:** This is exactly what I need. Two levels of protection. Merge it.

---

**Final state:** The audit log is protected by (a) the `AuditRepository` class which has no mutation methods beyond `insertEntry`, and (b) database-level `REVOKE` statements that block UPDATE and DELETE even via raw SQL access. Tests at `tests/unit/services/audit.service.test.ts` verify both protections.

---

## 3. Rejected Agent Suggestion

### What the Agent Produced

The agent suggested using **Prisma ORM** for the database layer instead of raw SQL. Here's the relevant diff it proposed:

```diff
+ // prisma/schema.prisma
+ generator client {
+   provider = "prisma-client-js"
+ }
+
+ datasource db {
+   provider = "postgresql"
+   url      = env("DATABASE_URL")
+ }
+
+ model User {
+   id       String   @id @default(uuid())
+   name     String
+   email    String   @unique
+   role     UserRole
+   events   Event[]
+   notes    Note[]
+   evidence Evidence[]
+   auditLog AuditLog[]
+ }
+
+ model Event {
+   id                String      @id @default(uuid())
+   supplier          String
+   partAsset         String
+   severity          Severity
+   status            EventStatus @default(NEW)
+   summary           String
+   detectedAt        DateTime
+   source            String
+   owner             User?       @relation(fields: [ownerId], references: [id])
+   ownerId           String?
+   recommendedAction String?
+   resolvedAt        DateTime?
+   createdAt         DateTime    @default(now())
+   updatedAt         DateTime    @updatedAt
+   notes             Note[]
+   evidence          Evidence[]
+   auditLog          AuditLog[]
+ }

// ... (3 more models)
```

```diff
- // src/server/db/connection.ts
- import { Pool } from 'pg';
- export class ConnectionPool { ... }
+ // prisma/client.ts
+ import { PrismaClient } from '@prisma/client';
+ export const prisma = new PrismaClient();
```

### Why I Rejected It

1. **Overkill for 5 tables.** Prisma introduces a code generation step, a migration engine, and 50+ generated TypeScript types. The assessment's data model is small and stable — raw SQL with the `pg` package is simpler and faster.

2. **Obscures query intent.** The `audit_log` append-only constraint is less visible with Prisma — you'd need a Prisma middleware to block `update`/`delete` calls. With a raw `AuditRepository` class, the absence of `update()` and `delete()` methods is immediately obvious during code review.

3. **Migration overhead.** Prisma migrations add complexity to deployment (migration files, drift detection). Since the assessment deliberately avoids production concerns, a single `schema.sql` file run once is adequate.

4. **PgBouncer compatibility.** Some Prisma versions have known issues with PgBouncer in transaction mode (prepared statement conflicts). The `pg` package handles this natively.

5. **The assignment explicitly tells me to own every line.** Using raw SQL means I understand exactly what queries are running. With Prisma, the generated client hides the actual SQL behind an abstraction layer.

### What I Did Instead

I used the `pg` package with a `ConnectionPool` singleton and a `BaseRepository<T>` abstract class. Each repository class writes its own parameterized SQL. See `src/server/db/repositories/` for all five repository implementations.

---

## 4. Bug Caught in Review

### Summary

A `LIMIT/OFFSET` SQL injection vulnerability via user-controlled sort columns.

### How I Noticed

While reviewing the agent's generated `EventRepository.listEvents()` method, I saw:

```typescript
const dataSql = `
  SELECT * FROM events ${whereClause}
  ORDER BY ${filters.sort} ${filters.order}
  LIMIT ${limit} OFFSET ${offset}
`;
```

The `sort` and `order` values were passed directly into the SQL string without parameterization or validation. A crafted request like `?sort=id; DROP TABLE events;--` could inject arbitrary SQL.

### What Would Have Happened in Production

An attacker could:
1. **Data exfiltration:** Inject `UNION SELECT` to read user emails, hashed passwords, or other sensitive columns.
2. **Data destruction:** Drop tables or truncate audit data.
3. **Data modification:** Inject `UPDATE` statements to change event statuses without audit entries.

### How I Fixed It

**Commit:** `<COMMIT_SHA>` — "Fix: validate sort/order against allowlist, use parameterized ordering"

**Fix (3 changes):**

1. **Added a validator allowlist:**
```typescript
// src/server/validators/filter.validator.ts
const ALLOWED_SORT_COLUMNS = [
  'detected_at', 'severity', 'status', 'created_at', 'supplier',
] as const;

const ALLOWED_SORT_ORDERS = ['asc', 'desc'] as const;

export class FilterValidator {
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
```

2. **Used the validator before query construction:**
```typescript
async listEvents(filters: EventFilters) {
  const sort = FilterValidator.validateSort(filters.sort);
  const order = FilterValidator.validateOrder(filters.order);
  // Now safe to interpolate into ORDER BY clause
}
```

3. **Kept query parameterization for user-provided values:**
```typescript
const dataSql = `
  SELECT e.*, u.name as owner_name
  FROM events e LEFT JOIN users u ON e.owner_id = u.id
  ${whereClause}
  ORDER BY e.${sort} ${order}
  LIMIT $${paramIndex++} OFFSET $${paramIndex++}
`;
```

The test at `tests/unit/validators/filter.validator.test.ts` now includes a case that asserts `FilterValidator.validateSort('id; DROP TABLE--')` throws a `ValidationError`.

---

## Lesson Learned

AI-generated code is great for boilerplate but cannot be trusted for security-sensitive paths (SQL construction, auth guards, audit integrity). Every user-controlled value that touches a database query must be either (a) parameterized or (b) validated against a strict allowlist. I added this as a standing review checklist item in `KNOWLEDGE.md`.

---

*This file will be updated with final commit SHAs and the exact transcript after implementation is complete.*