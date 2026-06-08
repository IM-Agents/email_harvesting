# Node.js — reference

**Canonical standard:** [../SKILL.md](../SKILL.md)  
**Suite index:** [../../SKILL.md](../../SKILL.md)  
**Language (required):** [../../javascript-advanced/SKILL.md](../../javascript-advanced/SKILL.md) · [../../typescript/SKILL.md](../../typescript/SKILL.md)

## Additional reference files

- [api-standards-design.md](api-standards-design.md) — API contract standards, errors, pagination, idempotency.
- [folder-structure.md](folder-structure.md) — recommended folder layout and layering rules.
- [middleware-patterns.md](middleware-patterns.md) — middleware ordering, examples, and anti-patterns.
- [security-performance.md](security-performance.md) — Node.js security and performance guardrails.
- [local-dev-nodemon.md](local-dev-nodemon.md) — nodemon for local API server, config, TypeScript, and pitfalls.
- [redis.md](redis.md) — Redis client, key naming, cache-aside, locks, rate limits, pub/sub, security.

## Repository layout (HTTP / API service)

### Standalone service repo

```
src/
  config/
  lib/              # logger, errors, db pool factory
  middleware/
  routes/
  services/
  repositories/
  types/
tests/
  integration/
  unit/
```

### Monorepo

Place the service under `apps/api` (or `services/orders-api`) and keep **the same `src/` layers** inside that app. Shared pure logic belongs in `packages/core-domain`, not inside route files.

**Middleware order (normative reminder)**

Security headers → body parser (with size limit) → request ID → authentication → routes → centralized error handler.

## Operational notes

- **Graceful shutdown:** stop accepting connections, drain, close pools, bounded exit timeout.
- **Outbound HTTP:** timeouts and `AbortController` on every external call.

## Code examples

### HTTP server with graceful shutdown

```javascript
import http from 'node:http';

export function createServer(requestListener) {
  const server = http.createServer(requestListener);

  const shutdown = (signal) => {
    console.info({ signal }, 'shutting down');
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  return server;
}
```

### Central error mapper (Express-style)

```javascript
export function errorMiddleware(err, req, res, next) {
  const status = err.status ?? 500;
  const code = err.code ?? 'internal_error';
  const message = status >= 500 ? 'Internal Server Error' : err.message;

  req.log?.error({ err, status, code });

  res.status(status).json({
    error: { code, message, requestId: req.id },
  });
}
```

### Outbound fetch with timeout

```javascript
export async function fetchJson(url, { timeoutMs = 5000, ...init } = {}) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: ctl.signal });
    if (!res.ok) throw Object.assign(new Error('upstream_error'), { status: res.status });
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}
```

