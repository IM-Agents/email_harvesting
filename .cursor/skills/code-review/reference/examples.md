# Code review — example findings

All findings follow [../SKILL.md](../SKILL.md) severity and comment shape.  
Each section shows: ✅ correct finding · ✗ incorrect / noisy version · the distinction.

---

## BLOCKERS

### Missing server-side authorization

```
Blocker — DELETE order without permission check
File: routes/orders.ts:88
Rule: nodejs-stack.mdc — MUST enforce authZ in handler/middleware; rules.mdc §Security
Issue: DELETE /orders/:id executes for any authenticated user; no ownership or role check.
Fix: Add `if (order.userId !== req.user.id) throw new ForbiddenError()` before the delete call, or apply requireRole('admin') middleware on this route.
```

**✗ Wrong version of this comment:**  
> "You should add some authorization logic here."  
Why it fails: no file/line, no rule, no concrete fix. Not actionable.

---

### SQL injection via string concatenation

```
Blocker — String-built SQL in user repository
File: repositories/user.php:34
Rule: php-stack.mdc — MUST use parameterized queries only
Issue: $pdo->query("SELECT id FROM users WHERE email = '$email'") interpolates raw user input, allowing classic SQL injection.
Fix: $stmt = $pdo->prepare('SELECT id FROM users WHERE email = :email'); $stmt->execute(['email' => $email]);
```

---

### Real secret committed

```
Blocker — API key committed in source
File: .env.local:3
Rule: rules.mdc §Security — secrets MUST NOT appear in repo
Issue: STRIPE_SECRET_KEY contains a live sk_live_... value. This key is now exposed in git history.
Fix: (1) Rotate the key immediately in the Stripe dashboard. (2) Remove the value, replace with STRIPE_SECRET_KEY=<your-stripe-secret-key>. (3) Add .env.local to .gitignore if not already present.
```

---

## MAJORS

### SELECT * in new query

```
Major — SELECT * in new orders query
File: queries/orders.sql:12
Rule: database-common-stack.mdc — MUST list only needed columns; never SELECT *
Issue: Returns all columns including unused PII fields (billing_address, card_last4), increasing payload size and exposing data unnecessarily.
Fix: SELECT id, status, total_cents, created_at FROM orders WHERE user_id = ?
```

---

### Silent catch block

```
Major — Swallowed sync error
File: services/sync.js:56
Rule: rules.mdc §Error Handling — never silently catch; javascript-stack.mdc
Issue: catch (e) {} swallows all sync failures. The caller assumes success and continues, potentially writing corrupt state.
Fix: log with context and rethrow — logger.error({ err: e, syncId }, 'sync failed'); throw e;
```

---

### TypeScript `any` in catch

```
Major — Untyped catch block
File: api/fetch.ts:29
Rule: typescript-stack.mdc — MUST use catch (err: unknown)
Issue: catch (e: any) disables type-checking on the error, allowing e.message access to silently fail on non-Error throws.
Fix: catch (err: unknown) { throw new Error('fetch failed', { cause: err instanceof Error ? err : undefined }) }
```

---

### useEffect memory leak

```
Major — Missing cleanup in useEffect subscription
File: components/Notifications.tsx:41
Rule: react-stack.mdc — MUST clean up subscriptions in useEffect return
Issue: WebSocket listener is added on mount but never removed. On component unmount and remount (e.g. route navigation), listeners accumulate.
Fix: Return a cleanup function — return () => socket.off('notification', handler);
```

---

### Unhandled promise in API handler

```
Major — Unhandled promise rejection in order handler
File: api/orders.ts:42
Rule: javascript-stack.mdc — async errors MUST be handled
Issue: fetchOrders() is called without await and without .catch(). Failures become unhandled rejections that crash the process in Node 18+.
Fix: const orders = await fetchOrders(); inside a try/catch, or .catch(err => next(err)) if using Express callback style.
```

---

## MINORS

### Missing JSDoc on new public export

```
Minor — New public export without documentation
File: lib/pricing.ts:8
Rule: rules.mdc §Code Quality — public APIs MUST have JSDoc
Issue: export function computeTax(amount, region) has no param or return documentation. Callers cannot infer units (cents vs dollars?) or valid region values.
Fix: Add TSDoc — @param amount - amount in cents; @param region - ISO 3166-1 alpha-2 code; @returns tax in cents
```

---

### Weak boolean naming

```
Minor — Boolean variable name does not convey truth value
File: services/cart.ts:17
Rule: rules.mdc §Naming — booleans MUST use is/has/can/should prefix
Issue: const loaded = true reads ambiguously — loaded what? A noun or an adjective?
Fix: rename to isLoaded or hasLoaded.
```

---

## NITS

### Commented-out code

```
Nit — Commented-out code block left in
File: utils/format.ts:23-29
Rule: rules.mdc §Code Quality (non-blocking)
Issue: Seven lines of commented code with no explanation. Adds noise, likely dead code from an earlier approach.
Fix: Delete if no longer needed, or add a comment explaining why it is preserved.
```

---

## SECURITY HOTSPOTS (flag for review, not auto-Blocker)

### New eval() usage

```
Security Hotspot — eval() introduced in template renderer
File: utils/template.ts:88
Rule: rules.mdc §Security — eval() requires human review
Issue: eval(userTemplate) executes arbitrary JavaScript. If userTemplate originates from user input at any point, this is a critical RCE vulnerability.
Review required: Trace the origin of userTemplate. If it is ever user-supplied or user-influenced, replace with a sandboxed template engine. If it is always a hard-coded developer string, document that clearly.
```

---

## VERIFIED SECTION — what to include

The `## Verified ✓` section is required. Examples of correct entries:

```markdown
## Verified ✓
- Input validated with Zod at the HTTP boundary (routes/orders.ts:12)
- All new SQL queries use parameterized statements
- New auth middleware tested with 401 and 403 cases in orders.test.ts
- Error responses do not include stack traces
```

A review with **only** findings and no Verified section is incomplete.

---

## ANTI-PATTERNS — reviewer mistakes to avoid

### ✗ Flagging what the linter already catches

```
Nit — Import should be alphabetically sorted
File: components/Card.tsx:3
```
**Why wrong:** ESLint import/order rule is in CI. This comment adds zero value and signals the reviewer did not check what tooling covers.

---

### ✗ Flagging pre-existing code the PR did not touch

```
Major — This class is 600 lines, violating the 400-line limit
File: services/UserService.ts (unchanged in this PR)
```
**Why wrong:** The PR did not modify this file. Pre-existing issues belong in a refactor ticket, not a PR review.

---

### ✗ Performance speculation without data

```
Major — This might be slow on large datasets
File: api/reports.ts:55
```
**Why wrong:** "Might be slow" is not a finding. Flag performance only when there is a proven N+1, full-table scan, or an unbounded loop in **new** code.

---

### ✗ Suggesting alternatives as findings

```
Minor — Consider using useReducer instead of useState here
File: components/Form.tsx:12
```
**Why wrong:** This is an opinion. No rule mandates useReducer over useState. Move to Follow-ups if you want to suggest it.

---

## Summary output examples

### Request changes

```markdown
## Summary
Request changes — Blocker: missing server authZ on DELETE /orders/:id; Major: SELECT * in new migration query.

## Findings

### Blocker — Missing authZ on DELETE /orders/:id
- **File:** `routes/orders.ts:88`
- **Rule:** `nodejs-stack.mdc`, `rules.mdc §Security`
- **Issue:** Any authenticated user can delete any order; no ownership or role check.
- **Fix:** Verify `order.userId === req.user.id` or apply `requireRole('admin')` before `Order.delete()`.

### Major — SELECT * in new query
- **File:** `queries/orders.sql:12`
- **Rule:** `database-common-stack.mdc` — MUST list only needed columns
- **Issue:** Returns all columns, including unused PII fields.
- **Fix:** `SELECT id, status, total_cents, created_at FROM orders WHERE user_id = ?`

## Verified ✓
- Input validated with Zod at route boundary
- Parameterized queries on all other repository methods
- New unit tests for happy path (orders.test.ts)

## Follow-ups (non-blocking)
- Ticket: Add integration test for forbidden delete (403 response)
- Consider extracting ownership check into shared middleware for reuse across routes
```

### Approve

```markdown
## Summary
Approve — No blocking issues found; one minor documentation gap noted.

## Findings

### Minor — Public export missing JSDoc
- **File:** `lib/pricing.ts:8`
- **Rule:** `rules.mdc §Code Quality`
- **Issue:** computeTax() has no documentation; units (cents vs dollars) are unclear to callers.
- **Fix:** Add TSDoc with @param and @returns describing units.

## Verified ✓
- Error handling: all async paths have try/catch with context logging
- No secrets in diff
- Auth check present on new admin route
- New behavior covered by unit tests

## Follow-ups
- None
```
