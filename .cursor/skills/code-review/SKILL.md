---
name: code-review-standards
description: Code review standards for PRs and diffs on allowed file types (.js, .jsx, .mjs, .py, .ts, .tsx, .html, .json, .css, .scss, .php, .dart, .sql, .sh, .env, .xml) — severity, mandatory gates, and stack compliance. Use when reviewing pull requests, auditing changes, or when the user asks for a code review.
---

# Code review standards

**Audience:** engineers and AI review agents.  
**Goal:** catch real bugs, security holes, and correctness issues in **changed** code. Surface only findings a reasonable senior engineer would block or comment on — not style preferences that linters already enforce.

**Principle (Sonar-aligned):** aim for **zero false positives** on bugs and code smells. Every finding must be a true issue with a clear fix. A noisy review is worse than no review.

**Baseline:** load the matching leaf `SKILL.md` + `*-stack.mdc` for each stack in the diff before writing findings. Never flag a rule the linter/formatter already enforces in CI.

---

## In-scope file types

`.js`, `.jsx`, `.mjs`, `.py`, `.ts`, `.tsx`, `.html`, `.json`, `.css`, `.scss`, `.php`, `.dart`, `.sql`, `.sh`, `.env` (and `.env.*`), `.xml`

- Review **only changed lines and their immediate context** — do not audit unrelated pre-existing code.
- `.env` / `.env.*`: **security-only** (§8). Blocker on real secrets; `.env.example` must use placeholders.
- Files outside this list: skip unless the user explicitly expands scope.

---

## 1. Severity — use exactly these four labels

| Level | Meaning | Merge decision |
|-------|---------|---------------|
| **Blocker** | Production crash, data loss, security exploit, broken public contract, missing server authZ, SQL injection, real secret in repo | Must fix before merge |
| **Major** | Violated `MUST` in stack rule; provable bug on reachable path; missing tests on auth / payment / delete; N+1 on hot path; `any`/silent catch in **new** code; new file > 400 lines or new function > 50 lines without split plan | Fix before merge |
| **Minor** | Violated `SHOULD`; missing JSDoc on new public export; coverage gap on non-critical path; weak naming on new identifiers | Fix or open ticket |
| **Nit** | Style, formatting, import order — **only when linter does NOT already enforce it** | Optional; never block |

**Hard rules for reviewers:**
- MUST NOT label a style-only comment as Blocker or Major.
- MUST NOT flag issues in files the PR did not change.
- MUST NOT flag things the CI linter / formatter already catches.
- MUST NOT invent findings to fill space. Silence is correct when code is clean.

---

## 2. Four finding categories (Sonar model)

Every finding falls into one of these. Use the category to calibrate severity.

| Category | Definition | False positives |
|----------|------------|-----------------|
| **Bug** | Code that is demonstrably wrong or more likely wrong than not — will produce incorrect results on a reachable path | Target: zero |
| **Vulnerability** | Code that could be exploited by an attacker — injection, broken authZ, exposed secret, weak crypto | Target: <20% |
| **Security Hotspot** | Security-sensitive code that needs human review but is not confirmed vulnerable (e.g. new crypto usage, dangerous flag, CORS config) | Flag for review, do not auto-Blocker |
| **Code Smell** | Maintainability issue — not wrong today but likely to cause bugs or slow future changes | Target: zero false positives; severity ≤ Major |

---

## 3. Universal gates (apply on every in-scope changed file)

Source: `rules.mdc`. Only flag these on **new or changed** code.

| Gate | Requirement | Blocker if violated |
|------|-------------|---------------------|
| Variables | `const` default; `let` when needed; **never `var`** | `var` in new/changed code |
| Errors | try/catch on I/O; non-empty catch with context; no unhandled promise rejections | Swallowed error, unhandled rejection |
| Security | Parameterized queries only; server-side authZ on sensitive routes; no secrets in source | Any of these missing |
| Naming | `camelCase` vars/fns, `UPPER_SNAKE` constants, `PascalCase` classes/components | Breaking rename of public export without migration note |
| Size | New/changed function ≤ 50 lines; new/changed file ≤ 400 lines | God function/file introduced by PR without split plan |
| Tests | Auth, payment, and delete paths must have failure-case tests | New critical path with zero tests |

**Do NOT gate on:**
- Code coverage percentage (track in CI, not per review comment)
- Bundle size / LCP / p95 latency unless there is a concrete measured regression in the PR
- Import order, whitespace, quote style — linter territory

---

## 4. TypeScript / JavaScript

Flag only on **new or changed** code.

**Blocker / Major:**
- `any` without validation in new TS code → Major
- `catch (e: any)` → Major (use `catch (err: unknown)`)
- Blind `as SomeType` cast on external input without schema parse → Major
- Unhandled promise (`.then()` with no `.catch()`, no `try/catch`) → Major / Blocker depending on path criticality
- `var` in new code → Major

```typescript
// ✗ Major — typescript-stack: catch must be unknown
catch (e: any) { return null }

// ✗ Major — typescript-stack: external input must be parsed, not cast
const user = (await res.json()) as User

// ✅ Correct
catch (err: unknown) {
  throw new Error('fetch failed', { cause: err instanceof Error ? err : undefined })
}
const user = userSchema.parse(await res.json())
```

**Do NOT flag:**
- Missing `import type` where types are also used as values
- Explicit return types on small private functions unless the rule enforces it
- Enum vs union debates unless team has a documented standard

---

## 5. React

Apply JS leaf skill on `.jsx`; apply TS leaf skill on `.ts`/`.tsx`.

**Must flag:**
- Array index as `key` when the list can reorder → Major
- `useEffect` with subscriptions / event listeners that has no cleanup → Major (memory leak)
- Rules of Hooks violation (conditional hook call) → Blocker

**Do NOT flag:**
- Missing `React.memo` or `useCallback` without profiler evidence of a problem
- Component file structure preferences (co-location vs separation) unless team rule exists
- Missing `displayName` on anonymous components

---

## 6. Node / API

**Must flag:**
- Missing server-side authZ on sensitive handler → Blocker
- Stack trace or raw error object returned to client in production path → Major
- User input used in query/command without validation → Blocker
- Missing HTTP status differentiation (all errors → 500) → Major

**Do NOT flag:**
- Logger choice or log level unless it leaks sensitive data
- Middleware ordering that does not affect security

---

## 7. Database (`.sql` and ORM code)

**Must flag:**
- String-concatenated SQL / user input in query → Blocker
- `SELECT *` in new production query → Major
- Missing index on new `WHERE` / `ORDER BY` / `JOIN` column on a table expected to grow > 10k rows → Major
- Destructive migration (DROP column/table) without documented rollback → Major

**Do NOT flag:**
- Query style preferences (subquery vs join) unless there is a proven performance issue
- ORM method alternatives when both are safe

---

## 8. Security

**Blocker:**
- Real API key, password, token, or private cert in diff (any file)
- Missing server-side permission check on create / update / delete / admin routes
- `innerHTML` or `dangerouslySetInnerHTML` with unsanitized user input
- String-built SQL / shell command from user data

**Major:**
- New dependency with known CVE or no clear justification
- Sensitive data (PII, tokens) written to logs

**Security Hotspot (flag for review, not auto-Blocker):**
- New cryptographic usage (flag for review: algorithm, key length, IV reuse)
- New CORS policy or `Access-Control-Allow-Origin: *`
- New `eval()`, `exec()`, `child_process.exec()` usage
- New file upload endpoint (path traversal risk)

---

## 9. Required comment shape

Every finding **MUST** include all five fields. Missing any field = incomplete finding, do not post.

```
[Severity] — <short title>
File: path/to/file.ext:line (or line range)
Rule: <rules.mdc section | *-stack.mdc MUST> 
Issue: what the code does wrong (one sentence, factual)
Fix: concrete change — snippet or exact steps
```

**Anti-patterns in comments:**
- ✗ "This looks messy" — no rule, no fix
- ✗ "Consider refactoring this" — opinion, not a finding
- ✗ "You could also do X" — suggestions belong in Follow-ups, not Findings
- ✗ Repeating the same finding for 10 similar lines — group into one finding with line range

---

## 10. Review output format

```markdown
## Summary
<Approve | Request changes | Comment only> — <one sentence why>

## Findings

### [Severity] — <title>
- **File:** `path:line`
- **Rule:** `rules.mdc §X` / `typescript-stack.mdc` / …
- **Issue:** …
- **Fix:** …

## Verified ✓
- <what the PR gets right — at least 1 item>

## Follow-ups (non-blocking)
- <suggestions, alternatives, tickets to open>
```

**Verified** is required. If the reviewer cannot identify anything the PR does correctly, re-read before posting — a review with zero positive findings is almost always incomplete.

---

## 11. Stack compliance — load per changed file type

| Changed file type | Load leaf skill | Load rule |
|-------------------|-----------------|-----------|
| `.js`, `.jsx`, `.mjs` | `javascript-advanced/SKILL.md` | `javascript-stack.mdc` |
| `.ts`, `.tsx` | `typescript/SKILL.md` | `typescript-stack.mdc` |
| `.jsx` / `.tsx` (UI) | also `react/SKILL.md` | also `react-stack.mdc` |
| `.js` / `.mjs` (APIs) | also `nodejs/SKILL.md` | also `nodejs-stack.mdc` |
| `.py` | `python/SKILL.md` | `python-stack.mdc` |
| `.php` | `php/SKILL.md` | `php-stack.mdc` |
| `.dart` | `flutter/SKILL.md` | `flutter-stack.mdc` |
| `.sql` | `database-common/SKILL.md` + dialect | `database-common-stack.mdc` + dialect |
| `.html`, `.css`, `.scss` | — | `rules.mdc`; `front-end-cursor-rules.mdc` |
| `.json` | — | `rules.mdc`; `typescript-stack.mdc` for `tsconfig*.json` |
| `.sh` | — | `rules.mdc` Security + shell: `set -euo pipefail`, quote vars |
| `.env`, `.env.*` | — | `rules.mdc` Security only |
| `.xml` | — | `rules.mdc` Security; Android manifest permissions |

Full mapping: [reference/stack-map.md](reference/stack-map.md)

---

## 12. Merge decision

| Condition | Decision |
|-----------|----------|
| Any Blocker open | Request changes |
| Any Major without an accepted ticket | Request changes |
| Only Minor / Nit / Follow-up | Approve with comments |
| Zero findings | Approve |

---

## 13. Out of scope — MUST NOT block on these

- Files the PR did not change
- Extensions not in the in-scope list (§ "In-scope file types")
- Formatting / import order already enforced by CI linter
- Optional refactors unrelated to the PR's stated change
- Architectural preferences without a team-documented rule
- Performance improvements without measured regression in the PR
- Test coverage on pre-existing untouched code paths

---

## Cross-references

- Checklists: [reference/README.md](reference/README.md)
- Stack map: [reference/stack-map.md](reference/stack-map.md)
- Examples: [reference/examples.md](reference/examples.md)
- Cursor rule: `rules/code-review-stack.mdc`
- Master rules: `rules/rules.mdc`
