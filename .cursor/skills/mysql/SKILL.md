---
name: mysql-standards
description: MySQL schema, naming, indexing, and query optimization standards plus MySQL vs PostgreSQL tradeoffs. Use when designing MySQL databases, migrations, or tuning OLTP/OLAP workloads on MySQL.

---

# MySQL Standards

## 1. Design rules (summary table)

| Area | Standard | Rationale |
|------|-----------|-----------|
| Engine | `InnoDB` for relational workloads | Transactions, FKs, crash safety |
| Charset/collation | `utf8mb4` + explicit collation | Full Unicode; consistent sorting |
| Primary keys | Surrogate `BIGINT` auto-increment or UUID (binary store) | Clustered index locality vs distribution |
| Timestamps | `TIMESTAMP`/`DATETIME` explicit TZ in app; store UTC | Avoid implicit session TZ bugs |
| Soft delete | `deleted_at` nullable vs status enum—pick one | Consistent filtering in queries |
| Money | `DECIMAL(p,s)` | No float rounding |
| Booleans | `TINYINT(1)` or `BOOLEAN` alias | Interop with ORMs |

## 2. Naming conventions

- **Tables:** plural `snake_case` (`order_items`) or singular—**one convention per product**.
- **Columns:** `snake_case`; foreign keys `parent_id` referencing `parents.id`.
- **Indexes:** prefix `idx_` + table + columns; uniques `uq_`.
- Avoid reserved words; quote only when unavoidable.

## 3. Indexing strategies

- Index **equality filters** first in composite indexes; **range** last.
- Cover frequent **ORDER BY** with matching index prefix.
- Watch **selectivity**; avoid indexing low-cardinality flags unless combined.
- Use **EXPLAIN ANALYZE** (8.0.18+) for real timings.

```sql
-- Typical OLTP lookup
CREATE INDEX idx_orders_user_created
  ON orders (user_id, created_at DESC);
```

## 4. Query optimization

- **Never `SELECT *`**—list only the columns the caller needs.
- **Pagination:** keyset (`WHERE id > ? ORDER BY id LIMIT n`) over large `OFFSET`.
- **Joins:** ensure FK columns indexed; update statistics (`ANALYZE TABLE`).
- **Batch writes** in transactions; tune `innodb_flush_log_at_trx_commit` vs durability SLA.

## 5. Schema design

- **Normalize** to 3NF for OLTP; denormalize only with measured read pain and refresh strategy.
- **Check constraints** where supported; enforce in app for portability if needed.
- **Partitioning** for very large time-series—validate pruning with EXPLAIN.

## 6. MySQL vs PostgreSQL — when MySQL fits best

| Factor | MySQL often fits when… |
|--------|-------------------------|
| Ops familiarity | Team/tooling optimized for MySQL replication/topology |
| Simple horizontal read scaling | Read replicas + proxy patterns are well-trodden |
| Specific managed offerings | Vendor SLA on MySQL-flavored services |

PostgreSQL leads for **complex SQL**, **JSONB-heavy** analytics, **CTE/materialized views**, **rich indexing** (GiST/GiN), and **stricter standards**. See [../postgresql/SKILL.md](../postgresql/SKILL.md).

## 7. Performance benchmarking

- **Workload fidelity:** capture production query mix; include writes.
- **Warm caches** vs **cold start**—report both for fairness.
- **Hardware parity** CPU/RAM/SSD; document `innodb_buffer_pool_size`, `max_connections`.
- Track **p95/p99** latency, not just QPS.

## 8. Environment & database bootstrap (local / Docker)

Default MySQL env for new backends (see also `rules/database-common-stack.mdc`, `rules/mysql-stack.mdc`):

Set in **`{monorepo}/.env.example`** (per product):

```bash
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=wawO=upD8EH!=upH!
DB_NAME={db_name}
```

| Context | `DB_NAME` |
|---------|-----------|
| Main IM agent | `{platform_db_name}` (`im_agent_local`) |
| Child QA `{monorepo}` | `{db_name}` unique — **never** `{platform_db_name}` |

**Examples:** `login` → `login_app`; `calculator` → `calculator_app`.

| Step | Command | When |
|------|---------|------|
| Create DB + migrate | `npm run db:init` | First setup or `{db_name}` schema missing |
| Migrate only | `npm run db:migrate` | Schema exists |
| Corrupt Knex migrations | Reset `{db_name}` schema (dev), then `db:init` | Wrong `DB_NAME` / shared schema |
| Status | `npm run db:status` | Verify applied migrations |
| Verify tables | `db:status`, `SHOW TABLES` on `{db_name}` | All expected tables from `migrations/` exist — fix pending/missing migrations first |
| Verify APIs | `curl` / HTTP client against preview | **Every** route that uses DB — fix failures before next work |

After preview + `/api/health`: **A)** `db:status` + table list vs migrations → **B)** test each DB route → fix schema or handler → re-test. Rule: `database-common-stack.mdc`; gate: `architecture.mdc` § 4.3 Step 3b.

Implementation: `scripts/init-db.js` + Knex `migrations/` (IM_coder_agent: `app/backend/`).

## Cross-references

- Shared rules: [../database-common/SKILL.md](../database-common/SKILL.md)
- Reference (examples + migrations layout): [reference/README.md](reference/README.md)
