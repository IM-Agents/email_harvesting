# Relational databases (common) — reference

**Canonical standard:** [../SKILL.md](../SKILL.md)  
**Suite index:** [../../SKILL.md](../../SKILL.md)

Cross-cutting rules for any relational workload and pointers to **engine-specific** examples under each stack’s `reference/README.md`.

## Additional reference files

- [query-optimization-standards.md](query-optimization-standards.md) — shared SQL query optimization standards for MySQL and PostgreSQL.

## Universal vs engine fit

| Standard | Rule (both engines) | Typically stronger in |
|----------|---------------------|------------------------|
| Normalization | Start 3NF OLTP; denorm only with metrics + strategy | Tie (discipline) |
| Surrogate keys | One clear PK strategy per product | Tie |
| Timestamps | Store UTC; app owns TZ display | PostgreSQL `timestamptz` |
| Constraints | Explicit NOT NULL; documented FK behaviors | PostgreSQL |
| Indexes | Index for queries you run; verify with EXPLAIN | Tie |
| JSON as attribute bag | Relational core + JSON for variance | PostgreSQL `jsonb` |
| Full-text | Dedicated FTS + right index | PostgreSQL native FTS |
| Read replicas | Understand async lag | Both (ops patterns differ) |

## Normalization

- **1NF:** atomic values; no repeating column groups.
- **2NF:** no partial dependency on part of a composite key.
- **3NF:** no transitive dependency on non-key attributes.
- **Denormalize** only with: reason doc, refresh or trigger story, tests against drift.

## Naming (portable)

- **`snake_case`** tables and columns unless the org explicitly standardizes otherwise.
- **FK columns:** `entity_id` referencing `entity(id)`.
- **Audit columns:** `created_at`, `updated_at`—triggers or app layer, not both inconsistently.

## Security

- **Least-privilege** DB roles; migrations use elevated role separately from runtime.
- **Parameterized queries** only.
- **TLS** to database in cloud; encryption at rest per infra policy.
- **PII:** classify data; mask non-prod restores.

## Backup & recovery

- **RPO/RTO** written down; restore drills on a schedule.
- Prefer **PITR** when the business requires it; test partial restores.

## Performance (shared)

- Fix **top slow queries** from logs or `pg_stat_statements` / slow query log.
- **Connection pooling** sized vs DB `max_connections`.
- **Keyset pagination** for large lists; avoid huge `OFFSET`.
- **Caching** in app tier with TTL + invalidation; avoid cache stampedes.

## Org: security & review gates

- **AuthZ** on every mutating API; default deny.
- **Secrets** in vault/KMS; never in logs or VCS.
- **Dependencies:** lockfile + CVE automation; patch SLAs by severity.
- **CORS/CSP/cookies:** explicit; no `*` with credentials in production.

**Review checklist**

- [ ] Edge cases tested where risk warrants
- [ ] Errors observable (logs/metrics/traces)
- [ ] Hot paths justified or profiled
- [ ] Migrations safe to deploy (expand/contract or dual-write when needed)
- [ ] PII handled per classification

**Documentation**

- ADRs for major forks; public APIs documented (e.g. OpenAPI).

## AI agent guardrails

- Follow the **leaf `SKILL.md`** for the active stack; use [MySQL reference](../../mysql/reference/README.md) and [PostgreSQL reference](../../postgresql/reference/README.md) for SQL patterns.
- Do not skip error handling, unbounded queries, or synchronous FS on hot server paths to save tokens.

## When to use which engine (summary)

| Prefer **PostgreSQL** when… | Prefer **MySQL** when… |
|-----------------------------|-------------------------|
| Heavy SQL, analytics, GIS, rich types | Org is MySQL-first with strong ops |
| JSONB-first features with indexes | Simple OLTP + familiar replica story |
| Exclusion constraints, advanced integrity | Template stacks / vendor on MySQL |

