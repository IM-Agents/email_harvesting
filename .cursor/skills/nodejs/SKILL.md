---
name: nodejs-standards
description: Server-side Node.js standards for HTTP APIs, middleware, async I/O, Redis, and performance. Always apply with javascript-advanced for .js and typescript for .ts backends. Use when building Node services, Express/Fastify APIs, or reviewing backend JavaScript/TypeScript.

---

# Node.js Standards

## 0. Language baseline (required)

Node.js code in this org **also** follows the language leaf skills and rules:

| File type | Skill | Cursor rule |
|-----------|--------|-------------|
| `.js`, `.mjs`, `.cjs` | [../javascript-advanced/SKILL.md](../javascript-advanced/SKILL.md) | `javascript-stack.mdc` |
| `.ts` | [../typescript/SKILL.md](../typescript/SKILL.md) | `typescript-stack.mdc` |

- **JavaScript:** ES modules, `const`/`let`, async/await, error `{ cause }`, no floating promises (when linted).
- **TypeScript:** `strict` tsconfig, no `any` at boundaries, Zod/env validation, explicit public return types.
- Prefer **TypeScript** for new Node services unless the repo is JavaScript-only.

## 1. Application shape

- **Entry clarity:** `server.js` or `main.ts` wires config, logger, HTTP server, graceful shutdown.
- **Layers:** router → controller (HTTP DTO) → service (use cases) → repositories (data). **No DB clients in controllers.**
- **Config:** 12-factor: environment for secrets and deployment-specific values; validate at startup (zod/joi/env-schema).

```javascript
// routes/user.js
import { Router } from 'express';
import { asyncHandler } from '../lib/async-handler.js';
import * as userService from '../services/user-service.js';

export const userRouter = Router();

userRouter.get('/:id', asyncHandler(async (req, res) => {
  const user = await userService.getUser(req.params.id);
  if (!user) return res.status(404).json({ error: 'not_found' });
  res.json({ data: user });
}));
```

## 2. Local development server (nodemon)

Use **nodemon** to run the API locally with automatic restart when source files change.

- **Dev only:** nodemon is for local development—not production (use `node`, PM2, Docker, or platform runners in prod).
- **Entry:** point nodemon at the same entry as production (`src/server.js`, `src/main.ts`, or compiled `dist/server.js` if using TypeScript build watch separately).
- **Watch:** include `src/` (or `app/`); exclude `node_modules`, `dist`, `coverage`, logs, and upload/temp dirs.
- **Env:** load `.env` / `.env.local` via your config layer; never commit secrets.
- **Graceful restart:** ensure the entry file handles `SIGTERM`/`SIGINT` so nodemon restarts do not leave open DB connections.

```json
{
  "scripts": {
    "dev": "nodemon",
    "start": "node src/server.js"
  }
}
```

```json
{
  "watch": ["src"],
  "ext": "js,json",
  "ignore": ["src/**/*.test.js", "coverage", "logs"],
  "exec": "node src/server.js",
  "env": { "NODE_ENV": "development" }
}
```

**Rules**

- Prefer `npm run dev` (or `pnpm dev`) as the standard local command.
- For TypeScript, use `nodemon --exec \"node --import tsx\" src/server.ts` or compile with `tsc -w` + nodemon on `dist/`—pick one approach per repo.
- Do not rely on nodemon for hot-reload of in-memory caches; restart clears process state by design.

More detail: [reference/local-dev-nodemon.md](reference/local-dev-nodemon.md).

## 3. Middleware

- **Order:** security headers → body parsers with limits → request ID → auth → routes → error handler.
- **Idempotency:** for mutating routes that clients retry, support idempotency keys where appropriate.
- **Timeouts:** server, reverse proxy, and outbound HTTP timeouts aligned.

## 4. Request handling

- Validate input at the edge; respond with **consistent error JSON** (`code`, `message`, optional `details`).
- Stream large downloads/uploads; cap body size.
- Prefer **structured logging** with request correlation ID.

```javascript
// lib/async-handler.js
export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}
```

## 5. Error handling

- Central **error middleware** maps domain errors to HTTP status; never leak stack traces in production responses.
- Operational vs programmer errors: retry/backoff only for operational (network blips), fail fast on programmer bugs after logging.

## 6. Logging

- **JSON logs** in production; levels `error`, `warn`, `info`, `debug` with sampling for high-volume debug.
- **PII redaction** at logging boundary; never log secrets or full payment payloads.

## 7. Async and performance

- **Non-blocking I/O** only; offload CPU-heavy work to worker threads or separate services.
- **Connection pools** for SQL; configure max connections vs DB limits.
- **Caching:** use **Redis** for shared cache, sessions, and rate limits across replicas; explicit TTLs and invalidation on writes. See [reference/redis.md](reference/redis.md).
- **Clustering:** use `cluster` or platform-level replicas; **sticky sessions** only if unavoidable—prefer stateless JWT/cookies + shared store.

```javascript
import cluster from 'node:cluster';
import os from 'node:os';

if (cluster.isPrimary) {
  for (let i = 0; i < os.availableParallelism(); i++) cluster.fork();
} else {
  await import('./http-server.js');
}
```

## 8. Memory and reliability

- Watch **event loop lag** and heap in APM. Fix leaks (listeners, global caches) before scaling horizontally.
- **Graceful shutdown:** stop accepting, drain connections, close DB pools, exit with timeout guard.

## 9. Security (API baseline)

- HTTPS termination at edge; HSTS where applicable.
- Rate limiting + authn/authz on mutating routes; CSRF strategy for cookie sessions.
- Dependency audit in CI; lockfiles committed.

## 10. Redis

Use Redis as a **shared external store** when multiple Node processes need the same cache, sessions, or rate-limit counters.

- **Client:** official `redis` package; one singleton per process (`connect` at startup, `quit` on shutdown).
- **Access:** only from services/repositories via `lib/redis-client.js`—not in route files.
- **Keys:** `{env}:{service}:{entity}:{id}` with a configurable prefix; always set **TTL** on cache keys.
- **Patterns:** cache-aside + delete-on-write invalidation; `INCR` + `EXPIRE` for rate limits; `SET NX EX` for short locks.
- **Failures:** fail closed for auth/rate limits; fail open to DB for optional caches (log and metric).
- **Security:** `rediss://` + AUTH in production; never cache secrets or raw PII.

Full guide: [reference/redis.md](reference/redis.md).

## Anti-patterns

- Synchronous `*Sync` fs APIs on request paths.
- Unbounded in-memory queues; unbounded `Promise.all` on user-controlled lists.
- Global mutable singletons without lifecycle tests.
- New Redis client per request; cache keys without TTL; `KEYS *` in production.

## Cross-references

- JavaScript: [../javascript-advanced/SKILL.md](../javascript-advanced/SKILL.md)
- TypeScript: [../typescript/SKILL.md](../typescript/SKILL.md)
- MySQL/Postgres/MongoDB: [../mysql/SKILL.md](../mysql/SKILL.md), [../postgresql/SKILL.md](../postgresql/SKILL.md), [../mongodb/SKILL.md](../mongodb/SKILL.md)
- Reference (layout + examples): [reference/README.md](reference/README.md)
