# JavaScript (ES6+) — reference

**Canonical standard:** [../SKILL.md](../SKILL.md)  
**Suite index:** [../../SKILL.md](../../SKILL.md)

Use this README for **repository layout** that touches shared JS packages, **patterns**, and **tooling** expectations.

## Additional reference files

- [advanced-standards.md](advanced-standards.md) — architecture, performance, async, and reliability standards.
- [best-practices.md](best-practices.md) — practical day-to-day coding and review checklist.

## Repository layout (packages & polyrepo)

### Monorepo — shared JS/domain packages

```
/apps
  /web-client
  /api
/packages
  /core-domain      # pure ES modules: no I/O, no React, no Node http
  /config-eslint
/tools
```

**Rules**

- `core-domain` **must not** import from `apps/*` or UI kits.
- **Secrets:** only in app roots / deployment; never committed.
- **Internal packages:** workspace protocol (npm/pnpm/yarn); published libs semver.

### Polyrepo — single repo

```
src/domain/
src/application/
src/infrastructure/
```

Domain stays free of framework globals and direct `fs`/`fetch` except behind interfaces you own.

## Org guardrails (JS)

- **Lint + format** in CI (`eslint`, `prettier` or `biome`); fail on agreed rules.
- **Async safety:** enable rules that catch floating promises where your toolchain supports it.
- **Tests:** pure functions without mocks; I/O behind integration tests.

## Code examples

### Bounded concurrency pool

```javascript
export async function mapPool(items, limit, mapper) {
  const results = new Array(items.length);
  let i = 0;

  async function worker() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await mapper(items[idx], idx);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}
```

### Retry with backoff (operational errors only)

```javascript
export async function withRetry(fn, { retries = 3, baseMs = 50 } = {}) {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err) {
      attempt += 1;
      if (attempt > retries) throw err;
      const delay = baseMs * 2 ** (attempt - 1);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}
```

### Result type for recoverable domain flows

```javascript
export function ok(value) {
  return { ok: true, value };
}

export function err(error) {
  return { ok: false, error };
}
```

