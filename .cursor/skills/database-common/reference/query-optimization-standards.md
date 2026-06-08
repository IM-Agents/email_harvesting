# Query Optimization Standards (MySQL + PostgreSQL)

Common standards to keep SQL fast, predictable, and production-safe across relational engines.

## 1) Core principles

- Optimize with measurements, not assumptions.
- Tune high-impact queries first (p95/p99 latency, CPU, buffer reads).
- Keep query behavior stable under realistic data volume.

## 2) Query shape standards

- **Never use `SELECT *`**—list only the columns required for the use case (API, job, or report).
- Prefer explicit join conditions and stable ordering.
- Use keyset pagination for large datasets; avoid high `OFFSET`.
- Avoid row-by-row loops in application code when set-based SQL is possible.

## 3) Index standards

- Add indexes for actual filter/sort/join patterns.
- Composite indexes: equality columns first, range/sort columns after.
- Remove duplicate or unused indexes (write amplification risk).
- Re-check index usefulness after schema and workload changes.

## 4) Explain-plan workflow

- PostgreSQL: use `EXPLAIN (ANALYZE, BUFFERS)`.
- MySQL: use `EXPLAIN ANALYZE` (or equivalent plan tooling).
- Verify row estimates vs actual rows; investigate large mismatches.
- Treat full table scans on large tables as investigation triggers.

## 5) Join and aggregation guidance

- Ensure join keys are indexed on both sides where relevant.
- Pre-aggregate with CTE/subquery when reducing large intermediate sets.
- Avoid unnecessary `DISTINCT`/`ORDER BY` on huge result sets.

## 6) Data access patterns

- Batch writes in transactions.
- Keep transactions short to reduce lock contention.
- For read-heavy endpoints, combine caching + optimized SQL.

## 7) Guardrails for generated SQL (agents and ORMs)

- Enforce query timeout budgets per endpoint/job.
- Cap list/filter sizes coming from user input.
- Never allow unbounded scans from dynamic filters.
- Log slow query fingerprints and cardinality context.

## 8) Anti-patterns

- `SELECT *` in application, migration seed, or report SQL.
- N+1 query loops from API handlers.
- Repeatedly querying the same reference data per request.
- Non-sargable predicates (`LOWER(column)` in filter without functional/index strategy).
- Mixing analytics-grade queries directly into OLTP request path.

## 9) Practical checklist

- [ ] Query plan reviewed (`EXPLAIN ...`)
- [ ] Proper index exists for filters + ordering
- [ ] Result set bounded (`LIMIT`/cursor)
- [ ] Timeout and retry policy defined
- [ ] p95/p99 measured in staging/load test

## 10) Example: keyset pagination

```sql
SELECT id, created_at, status
FROM orders
WHERE (created_at, id) < (?, ?)
ORDER BY created_at DESC, id DESC
LIMIT 50;
```
