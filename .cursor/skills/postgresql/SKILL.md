---
name: postgresql-standards
description: PostgreSQL schema, naming, indexing, advanced features (JSONB, windows, FTS), and optimization standards. Use when designing Postgres databases, analytics schemas, or comparing Postgres vs MySQL.

---

# PostgreSQL Standards

## 1. Design rules (summary table)

| Area | Standard | Rationale |
|------|-----------|-----------|
| IDs | `BIGSERIAL` / `GENERATED ALWAYS AS IDENTITY` or `uuid` (`uuid-ossp`/`pgcrypto`) | Clear uniqueness story |
| Text | `TEXT` with `CHECK`/`length` over arbitrary `VARCHAR(n)` unless constraint needed | Simpler migrations |
| Time | `timestamptz` everywhere | TZ-safe |
| Money | `numeric(p,s)` | Exact arithmetic |
| Enums | `CHECK` constraints or reference tables; `ENUM` type only if stable | Easier evolution than brittle enums |
| JSON | `jsonb` + GIN indexes for containment/path ops | Binary storage + indexable |

## 2. Naming conventions

- **Tables/columns:** `snake_case`; consistent pluralization per project.
- **Constraints:** `table_column_fkey`, `table_column_key`, `table_column_check`.
- **Indexes:** `table_column_idx` or `idx_table_columns`—pick one pattern repo-wide.

## 3. Advanced features (use deliberately)

| Feature | Guideline |
|---------|-----------|
| **JSONB** | Index with GIN (`jsonb_path_ops` when appropriate); avoid storing relational core data solely in JSON |
| **Window functions** | Prefer over correlated subqueries for rankings/moving averages |
| **CTEs** | Readable; watch **optimization fences**—materialize only when needed (`MATERIALIZED` in PG12+) |
| **Full-text** | `tsvector` columns maintained by trigger; GIN index; language config explicit |

```sql
SELECT user_id,
       amount,
       SUM(amount) OVER (PARTITION BY user_id ORDER BY created_at) AS running_total
FROM   ledger_entries;
```

## 4. Indexing and partitioning

- **B-tree** default; **BRIN** for very large naturally ordered data; **GiST/GiN** for geo/JSON/FTS.
- **Partial indexes** for hot subsets (`WHERE status = 'open'`).
- **Partitioning** by range (time) with constraint exclusion verified in plans.

## 5. Query optimization

- **`EXPLAIN (ANALYZE, BUFFERS)`** standard for tuning.
- **Never `SELECT *`**—list only the columns the caller needs.
- **Keyset pagination** on uniform access patterns.
- Manage **bloat**: autovacuum tuning; monitor `dead_tuple_percent`.

## 6. PostgreSQL vs MySQL — when PostgreSQL fits best

| Factor | PostgreSQL often fits when… |
|--------|------------------------------|
| SQL complexity | Heavy analytics, CTEs, windowing, custom types |
| Integrity | Rich constraints, exclusion constraints, FK behaviors |
| Extensibility | PostGIS, custom indexes, procedural languages |
| JSON-first | `jsonb` queries are first-class with indexing |

MySQL fits some **simple OLTP** and **organizational MySQL-first** ops stories; see [../mysql/SKILL.md](../mysql/SKILL.md).

## 7. Performance benchmarking

- Document **`shared_buffers`**, `work_mem`, `effective_cache_size`, connection pool (PgBouncer).
- Include **write-heavy** phases; measure **checkpoints/WAL** impact.
- Compare **p95/p99** with realistic concurrency; report client pool settings.

## Cross-references

- Shared rules: [../database-common/SKILL.md](../database-common/SKILL.md)
- Reference (examples + migrations layout): [reference/README.md](reference/README.md)
