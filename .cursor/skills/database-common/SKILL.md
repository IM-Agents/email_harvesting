---
name: database-common-standards
description: Relational database standards shared by MySQL and PostgreSQL—normalization, naming, security, backups, performance—with engine alignment notes. Use when choosing engines, auditing schemas, or authoring portable SQL.

---

# Relational Database Common Standards

## 1. Comparison: universal rules vs engine fit

| Standard | Rule (both engines) | Typically stronger in |
|----------|---------------------|------------------------|
| Normalization | Start 3NF OLTP; denorm with metrics | Tie—discipline matters more |
| Surrogate keys | Consistent PK strategy | Tie |
| Timestamps | Store UTC; app handles TZ | PostgreSQL `timestamptz` ergonomics |
| Constraints | NOT NULL defaults explicit; FKs ON behavior documented | PostgreSQL (richer) |
| Index hygiene | Index for queries you run, not columns you imagine | Tie—verify with EXPLAIN |
| JSON documents | Relational core + JSON for variable attributes | PostgreSQL `jsonb` |
| Full-text search | Dedicated FTS with proper indexes | PostgreSQL native FTS |
| Read replicas | Scale reads; async lag understood | Both—operational patterns differ |
| Partitioning | Range/list with pruning verified | Both—syntax differs |

## 2. Normalization principles

- **1NF:** atomic columns; no repeating groups.
- **2NF:** no partial dependency on composite keys.
- **3NF:** no transitive dependency on non-key attributes.
- **Denormalize** only with: documented reason, refresh or trigger strategy, tests preventing drift.

## 3. Naming conventions (portable mindset)

- **`snake_case`** for cross-team readability in SQL and ORMs.
- **Singular vs plural** table names: choose one; FKs named `entity_id`.
- **Stable audit columns:** `created_at`, `updated_at`; triggers or app-layer consistency—pick one.

## 4. Security practices

- **Least privilege DB users:** migrations separate from app runtime role.
- **No superuser** in application connections.
- **Parameterized queries** only—no string-concat SQL.
- **Encryption at rest** (disk/TDE) + **TLS** to DB in cloud.
- **PII minimization:** column-level access in warehouse; mask in non-prod snapshots.

## 5. Backup and recovery

- **RPO/RTO** documented; restore drills quarterly.
- **Point-in-time recovery** where business requires; test partial restores.
- **Logical vs physical** backups: logical for portability; physical for speed—often both.

## 6. Shared performance techniques

- **Measure:** slow query log / pg_stat_statements analog; fix top percentiles first.
- **Connection pooling:** avoid thundering herd; right-size pool vs DB `max_connections`.
- **Batch operations** in transactions; avoid chatty row-by-row when set-based is safe.
- **Column lists:** never `SELECT *`; project only needed columns in every query.
- **Caching** at app layer with explicit TTL; don’t cache without invalidation story.

## 7. When to use which engine (org decision checklist)

| Choose **PostgreSQL** if… | Choose **MySQL** if… |
|---------------------------|----------------------|
| Heavy analytics, windowing, CTEs, GIS, rich types | Existing MySQL estate and team depth |
| JSONB-heavy product features with indexed queries | Vendor template LAMP-style stacks |
| Need exclusion constraints, richer integrity | Simpler OLTP with proven replica story |

Hybrid orgs: **pick per service**; avoid gratuitous polyglot without boundary.

## Document databases (MongoDB)

For **flexible document models**, nested reads, or high-volume append-only events, see [../mongodb/SKILL.md](../mongodb/SKILL.md). Relational rules (normalization, portable SQL) still apply when choosing SQL over Mongo.

## Cross-references

- MySQL detail: [../mysql/SKILL.md](../mysql/SKILL.md)
- PostgreSQL detail: [../postgresql/SKILL.md](../postgresql/SKILL.md)
- MongoDB detail: [../mongodb/SKILL.md](../mongodb/SKILL.md)
- Reference (cross-cutting + SQL pointers): [reference/README.md](reference/README.md)
