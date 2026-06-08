# Redis with Node.js

Standards for using **Redis** from Node.js services: caching, sessions, rate limiting, distributed locks, and pub/sub. Use the official [`redis`](https://github.com/redis/node-redis) package (`node-redis` v4+).

## When to use Redis

| Use case | Pattern | Notes |
|----------|---------|--------|
| Hot read cache | Cache-aside + TTL | Not source of truth unless designed as such |
| HTTP session store | Key per session ID | Set TTL = session lifetime |
| Rate limiting | INCR + EXPIRE or sliding window | Prefer shared store when running multiple replicas |
| Distributed lock | `SET key NX EX` | Short TTL; always release in `finally` |
| Pub/sub notifications | `PUBLISH` / `SUBSCRIBE` | Separate subscriber connection |
| Job queues | Prefer BullMQ / dedicated queue | Do not reinvent reliability on raw lists unless required |

Do **not** put Redis in route handlers directly—access it from `services/` or `repositories/` via a thin client module.

## Project layout

```
src/
  config/
    redis.js          # URL, TLS, timeouts from env
  lib/
    redis-client.js   # singleton connect / quit
  services/
    cache-service.js
    rate-limit-service.js
```

## Configuration

Load from environment; validate at startup.

```javascript
// config/redis.js
export const redisConfig = {
  url: process.env.REDIS_URL ?? 'redis://127.0.0.1:6379',
  socket: {
    connectTimeout: 10_000,
    reconnectStrategy: (retries) => Math.min(retries * 100, 3_000),
  },
};
```

| Variable | Purpose |
|----------|---------|
| `REDIS_URL` | Connection string (`redis://`, `rediss://` for TLS) |
| `REDIS_PASSWORD` | Prefer embedding in URL or use client `password` option |
| `REDIS_KEY_PREFIX` | Optional global prefix per env (`prod:api:`) |

Never commit credentials; use secrets manager or CI-injected env in production.

## Client module (singleton)

One shared client per process. Create at startup; close on graceful shutdown.

```javascript
// lib/redis-client.js
import { createClient } from 'redis';
import { redisConfig } from '../config/redis.js';

let client;

export async function getRedis() {
  if (client?.isOpen) return client;

  client = createClient(redisConfig);
  client.on('error', (err) => {
    console.error({ err }, 'redis_client_error');
  });

  await client.connect();
  return client;
}

export async function closeRedis() {
  if (!client?.isOpen) return;
  await client.quit();
}
```

Wire `closeRedis()` into the same shutdown path as HTTP server and DB pools (`SIGTERM` / `SIGINT`).

```javascript
// server shutdown (excerpt)
process.on('SIGTERM', async () => {
  await closeRedis();
  // ... close server, DB
});
```

## Key naming

Use a consistent, colon-separated namespace:

```
{env}:{service}:{entity}:{id}
{env}:{service}:cache:{resource}:{id}
```

Examples:

- `prod:orders:cache:order:9f3a2b`
- `prod:auth:session:sess_abc123`
- `prod:api:ratelimit:ip:203.0.113.42`

Rules:

- Lowercase segments; no spaces.
- Include version in key only when schema of cached value changes (`:v2`).
- Apply `REDIS_KEY_PREFIX` in one helper—do not concatenate prefixes ad hoc.

```javascript
const prefix = process.env.REDIS_KEY_PREFIX ?? 'dev:api';

export const key = (...parts) => [prefix, ...parts].join(':');
```

## Serialization

- Prefer **JSON** for plain objects (`JSON.stringify` / `parse`).
- Use **string** values for counters and flags.
- For binary or very large payloads, document why Redis is appropriate; consider size limits (keep values small; aim &lt; 1 MB).

Always set **TTL** on cache keys unless the key is a durable counter with explicit lifecycle.

```javascript
await redis.set(key('cache', 'user', userId), JSON.stringify(user), {
  EX: 300, // 5 minutes
});
```

## Cache-aside (read-through)

```javascript
export async function getUserCached(userId) {
  const redis = await getRedis();
  const cacheKey = key('cache', 'user', userId);

  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const user = await userRepository.findById(userId);
  if (!user) return null;

  await redis.set(cacheKey, JSON.stringify(user), { EX: 300 });
  return user;
}
```

**Invalidation:** on write/update/delete, delete matching keys in the same transaction flow as the DB commit (or immediately after successful commit).

```javascript
await userRepository.update(userId, patch);
await redis.del(key('cache', 'user', userId));
```

Document invalidation rules in the service README or ADR before enabling cache.

## Stampede protection

For hot keys, avoid many concurrent recomputes on expiry:

- Short TTL + background refresh, or
- Lock around recompute:

```javascript
const lockKey = key('lock', 'cache', 'user', userId);
const acquired = await redis.set(lockKey, '1', { NX: true, EX: 10 });
if (!acquired) {
  // wait briefly and retry get, or return stale-if-available
}
try {
  const user = await userRepository.findById(userId);
  await redis.set(cacheKey, JSON.stringify(user), { EX: 300 });
  return user;
} finally {
  await redis.del(lockKey);
}
```

## Distributed lock (short critical sections)

Use only for **short** coordination (seconds), not long jobs.

```javascript
export async function withLock(redis, lockName, ttlSec, fn) {
  const lockKey = key('lock', lockName);
  const token = crypto.randomUUID();
  const ok = await redis.set(lockKey, token, { NX: true, EX: ttlSec });
  if (!ok) throw new Error('lock_not_acquired');

  try {
    return await fn();
  } finally {
    const current = await redis.get(lockKey);
    if (current === token) await redis.del(lockKey);
  }
}
```

Prefer **Redlock**-aware libraries or queue systems for complex locking.

## Rate limiting (fixed window)

```javascript
export async function checkRateLimit(redis, identifier, limit, windowSec) {
  const rateKey = key('ratelimit', identifier);
  const count = await redis.incr(rateKey);
  if (count === 1) await redis.expire(rateKey, windowSec);
  return count <= limit;
}
```

Return `429` from middleware when `checkRateLimit` is false. Use a shared Redis when running multiple API instances.

## Pub/sub

Use a **dedicated subscriber client** (blocking `subscribe` loop must not share the main command client).

```javascript
const sub = createClient(redisConfig);
await sub.connect();
await sub.subscribe('order:created', (message) => {
  // handle event
});
```

Unsubscribe and quit subscriber on shutdown.

## Error handling strategy

Choose explicitly per feature:

| Strategy | When |
|----------|------|
| **Fail closed** | Auth sessions, rate limits, idempotency locks—reject request if Redis is down |
| **Fail open** | Optional display cache—fall through to DB; log metric |

Never silently swallow Redis errors on security-sensitive paths.

```javascript
try {
  return await getUserCached(userId);
} catch (err) {
  req.log?.warn({ err }, 'redis_cache_miss_fallback');
  return userRepository.findById(userId);
}
```

## Pipelines and transactions

Batch related commands to reduce round-trips:

```javascript
const multi = redis.multi();
multi.del(key('cache', 'user', userId));
multi.del(key('cache', 'user-list', orgId));
await multi.exec();
```

Use `MULTI`/`EXEC` when atomicity across keys matters; understand Redis is single-threaded per instance.

## Security

- Use **TLS** (`rediss://`) in production.
- Enable **AUTH** / ACL users with least privilege (read-only user for cache-only workloads where possible).
- Do not store plaintext passwords, full payment PAN, or unencrypted PII—cache derived or public-safe DTOs only.
- Disable dangerous commands in managed Redis where supported (`FLUSHALL`, etc.).

## Local development

Run Redis via Docker Compose or local install; point `REDIS_URL` in `.env`:

```yaml
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

Document `REDIS_URL` in `.env.example`. Integration tests may use **Redis Stack**, **testcontainers**, or mock the cache service interface.

## Testing

- **Unit tests:** mock `cache-service` / repository interface; do not require live Redis.
- **Integration tests:** real Redis container with isolated DB index (`SELECT 1`) or random key prefix per test run; flush test keys in `afterEach`.

## Anti-patterns

- Creating a new `createClient()` per request.
- No TTL on cache keys (unbounded memory growth).
- Using Redis as the only copy of business data without persistence design.
- `KEYS *` in production (use `SCAN`).
- Storing huge blobs or entire list responses without pagination.
- Ignoring `error` events on the client.
- Long-lived locks without TTL (deadlocks on crash).

## Checklist

- [ ] Single `getRedis()` module; closed on graceful shutdown
- [ ] Key prefix and naming convention documented
- [ ] TTL on all cache entries; invalidation on writes defined
- [ ] Fail open vs closed documented per feature
- [ ] TLS + auth in production
- [ ] Rate limit / session store uses Redis when horizontally scaled
- [ ] No secrets or raw PII in cached values
