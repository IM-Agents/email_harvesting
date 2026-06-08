---
name: mongodb-standards
description: MongoDB schema design, indexing, aggregation, transactions, security, and Node.js driver (mongodb/Mongoose) standards. Use when designing collections, document models, migrations, Atlas config, or tuning MongoDB in Node.js services.

---

# MongoDB Standards

## 1. When to use MongoDB

| Fits well | Prefer SQL (MySQL/Postgres) instead |
|-----------|-------------------------------------|
| Flexible or evolving document shape | Strong relational integrity across many entities |
| Read-heavy profiles with embedded aggregates | Heavy cross-table reporting with complex joins |
| Content/catalog with nested attributes | Financial ledger requiring strict ACID invariants |
| Event logs, activity feeds, IoT batches | Mature team standard is relational-only |

See engine comparison: [../database-common/SKILL.md](../database-common/SKILL.md). Node.js access patterns: [../nodejs/SKILL.md](../nodejs/SKILL.md).

## 2. Design rules (summary)

| Area | Standard | Rationale |
|------|-----------|-----------|
| Data model | **Embed** when read together & bounded size; **reference** when shared or unbounded | Avoid 16 MB doc limit and stale duplicates |
| `_id` | Default `ObjectId` or explicit UUID/BSON type—**one strategy per service** | Stable sharding and index locality |
| Field names | `camelCase` in app layer; map to `snake_case` only if API/DB convention requires | Match Node.js + JSON APIs |
| Timestamps | `createdAt` / `updatedAt` (Date, UTC) on every mutable collection | Auditing and TTL policies |
| Money | `Decimal128` or integer minor units—**never float** | Precision |
| Soft delete | `deletedAt` nullable **or** status flag—one pattern per product | Consistent filters |
| Schema validation | JSON Schema at collection level **or** Mongoose schema—enforce at write boundary | Catch bad docs early |

## 3. Naming conventions

- **Collections:** plural `snake_case` (`order_items`) or camelCase plural—**pick one per repo**.
- **Fields:** consistent casing; foreign refs as `userId` (ObjectId) not loose strings.
- **Indexes:** `idx_{collection}_{fields}` in migration scripts; document purpose in comment.

## 4. Indexing

- Index **equality** fields first in compound indexes; **range/sort** last.
- **Unique** indexes for natural keys (`email`, `slug`) with partial filter when soft-deleting.
- **TTL** indexes only for true expiry (sessions, tokens)—not general cache.
- Use **`explain("executionStats")`** before shipping hot queries.

```javascript
// Compound index for list + sort
db.orders.createIndex({ userId: 1, createdAt: -1 })
```

## 5. Queries and pagination

- **Project** fields (`projection`); avoid returning full large documents.
- **Keyset pagination** on `_id` or `(createdAt, _id)`—avoid large `skip` on big collections.
- **Aggregation** for analytics; keep pipelines readable with `$match` early.
- **No unbounded** `find()` without `limit` in request paths.

## 6. Writes and consistency

- Use **multi-document transactions** only when needed (short, same replica set); default to single-document atomicity.
- **Idempotent** upserts for ingest/webhooks (`updateOne` + `upsert` with stable filter).
- **Optimistic concurrency:** `version` field or `updatedAt` check on updates.

## 7. Security

- **Least-privilege** DB user per app (readWrite on one DB, not `root`).
- **TLS** to cluster (Atlas/local); credentials from env/secrets manager.
- **Parameterized** filters only—never build query objects from raw user strings as keys.
- **Field-level encryption** or app-layer encryption for highly sensitive attributes when required.
- Redact connection strings and PII in logs.

## 8. Operations

- **Migrations:** versioned scripts (`migrate-mongo`, custom `db/migrations/mongodb/`).
- **Backups:** Atlas PITR or `mongodump` with tested restore; document RPO/RTO.
- **Connection pool:** one `MongoClient` per process; tune `maxPoolSize` vs cluster limits.
- **Graceful shutdown:** `client.close()` on SIGTERM with HTTP/queue drain.

## Anti-patterns

- Unbounded arrays embedded in documents (comments, tags without cap).
- Missing indexes on hot `find` / `$lookup` paths.
- Storing large binaries in documents (use GridFS or object storage).
- `skip` pagination on million-row collections.
- Global `MongoClient` per request.
- Using MongoDB as a cache without TTL discipline (use Redis—see [../nodejs/reference/redis.md](../nodejs/reference/redis.md)).

## Cross-references

- Relational comparison: [../database-common/SKILL.md](../database-common/SKILL.md)
- Node.js layering: [../nodejs/SKILL.md](../nodejs/SKILL.md)
- Reference (schema, driver, queries): [reference/README.md](reference/README.md)
