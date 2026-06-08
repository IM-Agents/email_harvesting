# MongoDB Queries, Indexes, and Aggregation

## Index guidelines

1. Match **real** production filters and sort order.
2. Compound index field order: equality → sort → range.
3. Use **partial** indexes for subsets (`{ status: 1 }` where `status: 'open'`).
4. Remove unused indexes (write amplification).

```javascript
// List user orders, newest first
db.orders.createIndex({ userId: 1, createdAt: -1 })

// Unique slug among active posts
db.posts.createIndex(
  { slug: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } }
)
```

Verify with:

```javascript
db.orders.find({ userId: ObjectId("...") }).sort({ createdAt: -1 }).limit(20).explain("executionStats")
```

Target: `totalDocsExamined` close to `nReturned`; avoid `COLLSCAN` on hot paths.

## Projections

```javascript
collection.find(
  { userId },
  { projection: { status: 1, totalCents: 1, createdAt: 1 } }
)
```

## Keyset pagination

```javascript
// After first page; cursor = last item's createdAt + _id
export async function listOrdersAfter(userId, cursor, limit = 20) {
  const filter = { userId: new ObjectId(userId), deletedAt: null }
  if (cursor) {
    filter.$or = [
      { createdAt: { $lt: cursor.createdAt } },
      { createdAt: cursor.createdAt, _id: { $lt: cursor._id } },
    ]
  }
  return collection()
    .find(filter)
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit)
    .toArray()
}
```

Avoid `skip((page - 1) * limit)` for deep pages.

## Aggregation pipeline

```javascript
db.orders.aggregate([
  { $match: { status: 'paid', createdAt: { $gte: ISODate('2025-01-01') } } },
  { $group: { _id: '$userId', totalCents: { $sum: '$totalCents' }, count: { $sum: 1 } } },
  { $sort: { totalCents: -1 } },
  { $limit: 100 },
])
```

Rules:

- **`$match` early** to reduce working set.
- **`$lookup`** only when necessary; ensure foreign field indexed.
- Spill to disk is costly—monitor `allowDiskUse` and pipeline size.

## Updates

```javascript
// atomic increment
await collection.updateOne(
  { _id: orderId, version: expectedVersion },
  { $inc: { version: 1 }, $set: { status: 'shipped', updatedAt: new Date() } }
)

// upsert idempotent ingest
await collection.updateOne(
  { externalId: event.id },
  { $setOnInsert: { createdAt: new Date() }, $set: { payload: event.data, updatedAt: new Date() } },
  { upsert: true }
)
```

## Text search

Prefer **Atlas Search** or dedicated search (OpenSearch) for full-featured search. For simple cases:

```javascript
db.articles.createIndex({ title: 'text', body: 'text' })
db.articles.find({ $text: { $search: 'mongodb indexing' } })
```

## Read preference & write concern

| Setting | Guidance |
|---------|----------|
| `readPreference: primary` | Default for consistent reads after writes |
| `readPreference: secondaryPreferred` | OK for analytics/dashboards; accept replication lag |
| `writeConcern: { w: 'majority' }` | Default for durable writes in replica sets |

Document lag tolerance when reading from secondaries.

## Performance checklist

- [ ] Hot queries reviewed with `explain("executionStats")`
- [ ] Projections on list/detail endpoints
- [ ] Keyset pagination for large lists
- [ ] `$match` first in aggregations
- [ ] No unbounded `find()` in API layer
- [ ] Indexes created via migrations, not only at dev startup
