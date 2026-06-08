# MongoDB Schema Design

## Embed vs reference

| Embed (subdocument/array) | Reference (ObjectId + `$lookup` or second query) |
|---------------------------|--------------------------------------------------|
| Always read together | Shared entity (user, product) used in many parents |
| Bounded list (e.g. &lt; 100 line items per order) | Unbounded growth (comments, events) |
| Snapshot acceptable (historical copy) | Single source of truth must stay current |

**Rule:** if duplication would cause update anomalies across many documents, **reference** and join in application or aggregation.

## Document size

- Hard limit **16 MB** per document—monitor array growth.
- Prefer **bucket pattern** for high-volume time series (one doc per bucket of events).

## Example: order with embedded lines

```javascript
{
  _id: ObjectId("..."),
  userId: ObjectId("..."),
  status: "paid",
  totalCents: 4999,
  lines: [
    { sku: "SKU-1", qty: 2, unitCents: 1999 }
  ],
  createdAt: ISODate("2025-01-15T10:00:00Z"),
  updatedAt: ISODate("2025-01-15T10:05:00Z")
}
```

## Example: user reference

```javascript
// orders collection
{ userId: ObjectId("..."), /* ... */ }

// users collection — canonical profile
{ _id: ObjectId("..."), email: "a@b.com", name: "Ada" }
```

## Validation (collection-level)

```javascript
db.createCollection("orders", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["userId", "status", "createdAt"],
      properties: {
        userId: { bsonType: "objectId" },
        status: { enum: ["pending", "paid", "cancelled"] },
        totalCents: { bsonType: "int", minimum: 0 }
      }
    }
  },
  validationLevel: "strict",
  validationAction: "error"
})
```

## Mongoose schema (when using Mongoose)

```javascript
import mongoose from 'mongoose'

const orderLineSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true },
    qty: { type: Number, required: true, min: 1 },
    unitCents: { type: Number, required: true, min: 0 },
  },
  { _id: false }
)

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { type: String, enum: ['pending', 'paid', 'cancelled'], required: true },
    totalCents: { type: Number, required: true },
    lines: { type: [orderLineSchema], default: [] },
  },
  { timestamps: true, collection: 'orders' }
)

orderSchema.index({ userId: 1, createdAt: -1 })
```

## Audit and soft delete

Pick one pattern repo-wide:

```javascript
// soft delete
{ deletedAt: null | ISODate(...) }

// queries always filter
{ deletedAt: null }
```

Partial unique index for active emails:

```javascript
db.users.createIndex(
  { email: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } }
)
```

## Anti-patterns

- Giant embedded arrays without cap or archival strategy.
- Storing `user` object copy on every order **and** expecting live profile sync everywhere.
- Mixed types for the same field (`status` as string and number).
- Missing `required` / validation on write paths.
