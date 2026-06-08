# Code review — reference checklists

Normative checklists for [../SKILL.md](../SKILL.md). Align with `.cursor/rules/rules.mdc`.

**Stack → skill → rule map:** [stack-map.md](stack-map.md)  
**Example findings:** [examples.md](examples.md)

> **Signal-to-noise rule:** if the linter or formatter already enforces it in CI, do not comment on it here. Every tick below is a human or AI judgment call, not a machine check.

---

## Phase 1 — Pre-review setup (do this before reading any code)

- [ ] Read the PR description, linked ticket, and stated intent
- [ ] Identify which **changed** files are in the in-scope extension list
- [ ] List the stacks present → open the matching leaf `SKILL.md` + `*-stack.mdc` from [stack-map.md](stack-map.md)
- [ ] Mark the **risk areas**: auth flows, money handling, delete operations, public API contracts, database migrations
- [ ] Note the PR size: > 400 changed lines → ask author to split before deep review

---

## Phase 2 — Bug & correctness (Blocker / Major)

These are the highest-value checks. A missed bug here is a production incident.

- [ ] Null / undefined dereference on a reachable path (no guard)
- [ ] Off-by-one in loop bounds, slice indices, pagination math
- [ ] Race condition: shared mutable state accessed concurrently without a lock/guard
- [ ] Async: `await` missing on a Promise that must resolve before continuing
- [ ] Unhandled promise rejection (bare `.then()` with no `.catch()`, no surrounding `try/catch`)
- [ ] Early return / guard clause missing — function continues on error state
- [ ] Type mismatch: string vs number comparison with `==` instead of `===` in JS/TS

---

## Phase 3 — Security (Blocker / Major / Hotspot)

Apply to every PR — not only "security-related" changes.

**Blockers — fix before merge:**
- [ ] Real secret, API key, password, or token in any committed file
- [ ] Server-side authZ missing on create / update / delete / admin endpoint
- [ ] User input concatenated into SQL, shell command, file path, or `eval()`
- [ ] `innerHTML` / `dangerouslySetInnerHTML` set from user-controlled data without sanitization
- [ ] Sensitive data (PII, tokens, passwords) written to logs or error responses sent to client

**Hotspots — flag for human review, not auto-Blocker:**
- [ ] New cryptographic primitive (check: algorithm, key length, IV uniqueness)
- [ ] New CORS rule or wildcard origin
- [ ] New `eval()`, `exec()`, `child_process` call
- [ ] New file upload handler (path traversal risk)
- [ ] New rate-limit or auth bypass flag in config

---

## Phase 4 — Error handling (Blocker / Major)

- [ ] Every I/O call (network, DB, filesystem) has a try/catch or equivalent
- [ ] Catch blocks are non-empty and log with context (operation + relevant IDs)
- [ ] TS: `catch (err: unknown)` — not `any`; errors narrowed with `instanceof`
- [ ] Errors mapped to safe, user-friendly messages before reaching client
- [ ] No unhandled rejection left in async chain

```javascript
// ✗ Major — silent catch
try { await syncData() } catch (e) {}

// ✅ Correct
try {
  await syncData()
} catch (err) {
  logger.error({ err, userId }, 'syncData failed')
  throw err
}
```

---

## Phase 5 — Stack-specific gates

Only apply the section matching the file type in the diff.

### TypeScript / JavaScript
- [ ] No `var` in new/changed code
- [ ] No new `any` type
- [ ] External input validated with schema parse (Zod, Yup, etc.) — not cast with `as`
- [ ] `async/await` used; no unhandled `.then()` chains
- [ ] Named exports for shared modules (tree-shakeable)

### React (`.jsx` / `.tsx`)
- [ ] List items use stable, non-index keys (when list can reorder)
- [ ] `useEffect` with subscriptions / event listeners has a cleanup return
- [ ] No Rules of Hooks violation (conditional call, call in loop)
- [ ] Props typed in `.tsx` files

### Node / API
- [ ] Request body / query / params validated at the HTTP boundary before domain logic
- [ ] Correct HTTP status codes: 4xx for client errors, 5xx for server errors
- [ ] No stack trace or internal error detail in production response body
- [ ] Server-side authZ enforced in handler or middleware — not UI-only

### Database / SQL
- [ ] Only parameterized queries / ORM bindings — no string concatenation
- [ ] No `SELECT *` in new production queries (list only needed columns)
- [ ] Index added for new `WHERE` / `ORDER BY` / `JOIN` on tables expected to grow
- [ ] Destructive migration (DROP, truncate) has documented rollback plan
- [ ] Multi-step writes wrapped in a transaction

### PHP
- [ ] `declare(strict_types=1)` present on new files if repo uses it
- [ ] PDO / ORM with parameterized queries only
- [ ] Web-accessible files limited to `public/` only

### Flutter / Dart
- [ ] Null-safe; `!` operator justified, not suppression
- [ ] Async UI shows loading and error states
- [ ] Long lists use `ListView.builder` or slivers

### Shell (`.sh`)
- [ ] `set -euo pipefail` (or team equivalent) at top
- [ ] All variables quoted (`"$VAR"`)
- [ ] No secrets embedded in script body

---

## Phase 6 — Tests

- [ ] New behavior (functions, branches) has at least one test
- [ ] Auth, payment, and delete paths have **failure-case** tests (not just happy path)
- [ ] Tests are deterministic — no sleep/timeout as synchronization, no flaky network calls

> Coverage percentage is a CI metric — do not comment on the number in the review. Flag only when a **critical path** (auth / money / delete) has **zero** tests.

---

## Phase 7 — Code quality (Minor / Nit only)

Flag only on **new** code introduced by the PR. Do not audit pre-existing code.

- [ ] New public function / method has JSDoc / TSDoc
- [ ] Function name is a verb-first description of what it does
- [ ] Boolean variable uses `is` / `has` / `can` / `should` prefix
- [ ] No commented-out code blocks left in
- [ ] No magic numbers — use named constants

---

## Merge decision table

| State | Decision |
|-------|----------|
| Any Blocker open | ❌ Request changes |
| Major without accepted follow-up ticket | ❌ Request changes |
| Only Minor / Nit / Follow-ups | ✅ Approve with comments |
| Zero findings | ✅ Approve |

---

## What NOT to comment on (anti-patterns)

These generate noise, erode trust in the review, and slow teams down:

| ✗ Do not flag | Why |
|--------------|-----|
| Formatting, spacing, import order | CI linter handles this |
| Refactors unrelated to the PR | Separate ticket/PR |
| Performance improvements with no measured regression | Speculation without data |
| File/folder organization preferences | Unless a team rule exists |
| Existing pre-PR code that the PR did not touch | Out of scope |
| "Consider using X instead of Y" style preferences | Opinion, not a rule |
| Test coverage percentage | CI metric, not review comment |
| Missing features the PR doesn't claim to add | Separate ticket |

---

## Finding template (copy-paste)

```
[Severity] — <short title>
File: path/to/file.ext:line
Rule: <rules.mdc §X | *-stack.mdc MUST>
Issue: <one sentence — what the code does wrong>
Fix: <concrete change or steps>
```

---

## Related

- [stack-map.md](stack-map.md) — full skills + rules index  
- [examples.md](examples.md) — sample findings with anti-patterns  
- `.cursor/rules/code-review-stack.mdc`  
- `.cursor/rules/rules.mdc`  
- `.cursor/skills/SKILL.md` — standards suite index
