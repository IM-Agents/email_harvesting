---
name: javascript-advanced-standards
description: Defines ES6+ JavaScript organization, naming, errors, async, and performance standards for human onboarding and AI-generated code. Use when writing or reviewing modern JavaScript, Node/browser modules, tooling configs, or performance-sensitive JS.

---

# JavaScript Advanced Standards

**Audience:** engineers and code-generating agents. **Goal:** predictable, fast, maintainable JavaScript.

## 1. Code organization

- **Modules:** Prefer ES modules (`import`/`export`). One primary concern per file; avoid barrel files that re-export entire trees unless measured need.
- **Layers:** Separate **pure domain logic** from I/O (HTTP, DOM, `fs`). Domain modules must not import framework-specific globals.
- **Side effects:** Avoid top-level side effects except app entry. Lazy-init singletons behind functions when order matters.
- **Public API:** Export explicit names; avoid `export default` for libraries (app entrypoints may use default).

```javascript
// user-service.js — domain-facing API
export async function getUserById(userId) {
  if (!userId) throw new TypeError('userId required');
  // ...
}
```

## 2. Naming conventions

| Kind | Convention | Example |
|------|--------------|---------|
| Variables, functions | `camelCase` | `fetchOrders` |
| Classes, constructors | `PascalCase` | `OrderRepository` |
| Constants (true invariants) | `SCREAMING_SNAKE` | `MAX_RETRIES` |
| Private intent | Leading `_` only by team agreement | `_internalCache` |
| Files (non-React) | `kebab-case` or `camelCase` (pick one repo-wide) | `order-service.js` |

**Booleans** must read as predicates: `isReady`, `hasAccess`, `canRetry`.

## 3. Style and syntax (ES6+)

- Use `const` by default; `let` when reassigned; never `var`.
- Prefer **destructuring** for stable shapes; avoid deep nesting.
- Use **optional chaining** and **nullish coalescing** for clarity, not as a substitute for validation at boundaries.
- **Template literals** for string composition; tagged templates only with clear justification.

## 4. Error handling

- **Throw `Error` subclasses** with actionable messages at system boundaries (HTTP, CLI, IPC).
- **Never swallow errors:** log or rethrow with context; use `{ cause }` when wrapping.
- **Result types** (`ok`/`err`) are acceptable for domain flows that expect recoverable failures.

```javascript
async function readConfig(path) {
  try {
    return await fs.promises.readFile(path, 'utf8');
  } catch (err) {
    throw new Error(`Failed to read config: ${path}`, { cause: err });
  }
}
```

## 5. Async patterns

- **`async`/`await`** for linear control flow; **`Promise.all`** for independent tasks with bounded concurrency for large sets.
- Always **timeout** or **abort** external calls (`AbortController`).
- **Avoid async functions in hot sync loops** without profiling; batch or offload.

```javascript
const ctl = new AbortController();
const t = setTimeout(() => ctl.abort(), 5000);
try {
  await fetch(url, { signal: ctl.signal });
} finally {
  clearTimeout(t);
}
```

## 6. Performance

**Do**

- Preallocate arrays when size known; prefer `Map`/`Set` for keyed lookups at scale.
- Minimize allocations in hot paths; reuse buffers where safe.
- Use **streaming** (`Readable`/`pipeline`) for large I/O in Node.

**Avoid**

- Mega-objects cloned every tick; unbounded caches; `JSON.parse` on hot paths without need.
- N+1 async calls; accidental sequential `await` in loops when parallel is safe.

## 7. Anti-patterns

- **Implicit coercion** for business logic (`==`, loose truthiness on IDs).
- **Mutating** shared module-level state from many callers.
- **God modules** mixing HTTP, DB, and UI concerns.
- **Unhandled promise rejections** in servers and long-running workers.

## 8. Testing and tooling hooks

- Pure functions: unit test without mocks. I/O: integration tests with real dependencies or containers.
- Enforce **eslint + prettier** (or biome) in CI; block on `no-floating-promises` for TS/JS async safety where applicable.

## Cross-references

- TypeScript: [../typescript/SKILL.md](../typescript/SKILL.md)
- React UI: [../react/SKILL.md](../react/SKILL.md)
- Node APIs: [../nodejs/SKILL.md](../nodejs/SKILL.md)
- Reference (layout + examples): [reference/README.md](reference/README.md)
