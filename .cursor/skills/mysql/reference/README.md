# MySQL — reference

## Default env (`{monorepo}`)

```bash
# {monorepo}/.env.example
DB_HOST=localhost
DB_NAME={db_name}
```

| | |
|--|--|
| Platform main agent | `DB_NAME={platform_db_name}` (`im_agent_local`) |
| Child app | `DB_NAME={db_name}` — e.g. `login_app`, `calculator_app` |

- Docker: `DB_HOST=db` from container (wins over `.env` `localhost`).
- `loadEnv`: `DB_NAME` from `{monorepo}/.env` only — `env-variables.mdc`.
- Corrupt migrations → wrong schema; reset `{db_name}`, then `db:init`.
- **Task done (MySQL):** `db:status` + all expected tables in `{db_name}`; then test all DB-backed APIs on preview (`database-common-stack.mdc`).

Rules: `rules/mysql-stack.mdc`, `rules/database-common-stack.mdc`.

**Canonical standard:** [../SKILL.md](../SKILL.md)  
**Suite index:** [../../SKILL.md](../../SKILL.md)

## Migrations & repo layout

- Prefer `db/migrations/mysql/` (or `migrations/mysql/`) in the service that owns the schema.
- **Forward-only** migrations in CI; rollbacks require runbooks.
- If the org runs **both** engines, split directories: `db/migrations/mysql` vs `db/migrations/postgresql`—never interleave.

## Benchmarking (quick checklist)

- Match **hardware** and buffer pool / connection limits across runs.
- Include **writes** and mixed workloads; report **p95/p99**, not only QPS.
- Compare **warm** vs **cold** cache when publishing results.

## Code examples

### Table DDL (InnoDB, utf8mb4)

```sql
CREATE TABLE orders (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id       BIGINT UNSIGNED NOT NULL,
  status        VARCHAR(32) NOT NULL,
  total_cents   BIGINT NOT NULL,
  created_at    DATETIME(3) NOT NULL,
  updated_at    DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_orders_user_created (user_id, created_at),
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Keyset pagination

```sql
SELECT id, user_id, created_at
FROM orders
WHERE user_id = ?
  AND (created_at, id) < (?, ?)
ORDER BY created_at DESC, id DESC
LIMIT 50;
```

### Analyze + explain

```sql
ANALYZE TABLE orders;
EXPLAIN ANALYZE
SELECT id, user_id, created_at
FROM orders
WHERE user_id = 42
ORDER BY created_at DESC
LIMIT 50;
```

