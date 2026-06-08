# PostgreSQL — reference

**Canonical standard:** [../SKILL.md](../SKILL.md)  
**Suite index:** [../../SKILL.md](../../SKILL.md)

## Migrations & repo layout

- Prefer `db/migrations/postgresql/` (or equivalent) in the owning service.
- **Forward-only** in CI; data fixes via new migrations, not hand-edits on prod.
- Document required extensions (`uuid-ossp`, `pgcrypto`, `postgis`) in the migration header or service README.

## Benchmarking (quick checklist)

- Report **`shared_buffers`**, `work_mem`, pooler (e.g. PgBouncer) settings.
- Stress **writes** and checkpoint/WAL behavior for honest latency.
- Use **`EXPLAIN (ANALYZE, BUFFERS)`** when sharing tuning outcomes.

## Code examples

### Table with `timestamptz` + `jsonb`

```sql
CREATE TABLE events (
  id          bigserial PRIMARY KEY,
  user_id     bigint NOT NULL REFERENCES users (id),
  kind        text NOT NULL,
  payload     jsonb NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX events_user_created_idx ON events (user_id, created_at DESC);
CREATE INDEX events_payload_gin ON events USING gin (payload jsonb_path_ops);
```

### JSONB containment

```sql
SELECT id
FROM events
WHERE payload @> '{"source":"billing"}'::jsonb
ORDER BY created_at DESC
LIMIT 100;
```

### Window + explain

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT user_id,
       kind,
       count(*) OVER (PARTITION BY user_id) AS events_per_user
FROM events
WHERE created_at > now() - interval '7 days';
```

