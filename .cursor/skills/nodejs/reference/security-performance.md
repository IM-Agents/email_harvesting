# Node.js Security and Performance

Operational guardrails for secure and fast Node.js services.

## Security standards

- Validate all inbound payloads at the HTTP boundary.
- Enforce authn/authz on every mutating endpoint.
- Use parameterized SQL only; no string-built queries.
- Redact secrets and PII in logs.
- Set strict request body size limits.
- Apply rate limiting on public and expensive endpoints.
- Keep dependencies patched; run vulnerability scans in CI.

## Performance standards

- Avoid sync APIs (`fs.readFileSync`) on request paths.
- Configure DB connection pools based on DB limits.
- Use bounded concurrency for bulk jobs and fan-out calls.
- Add timeouts and cancellation for outbound HTTP.
- Prefer streaming for large uploads/downloads.
- Measure p95/p99 latency and event-loop lag.

## Caching guidance

- Use **Redis** for shared cache across API replicas; see [redis.md](redis.md).
- Use cache for hot read paths with explicit TTL.
- Prevent stampedes using locking/coalescing strategy.
- Document invalidation rules before enabling cache.

## Minimal secure middleware stack

```javascript
app.use(helmet());
app.use(express.json({ limit: '1mb' }));
app.use(requestId);
app.use(authenticate);
app.use(rateLimiter);
app.use('/v1', routes);
app.use(errorMiddleware);
```

## Performance checklist

- [ ] Route-level latency metrics added
- [ ] Timeouts defined for all external calls
- [ ] No unbounded `Promise.all` on user-sized lists
- [ ] Critical queries indexed and explain-reviewed
- [ ] Graceful shutdown tested under load
