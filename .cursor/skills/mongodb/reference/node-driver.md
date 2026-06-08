# MongoDB with Node.js

Access MongoDB only from **repositories** or data layer—not from Express route handlers.

## Driver choice

| Library | Use when |
|---------|----------|
| Official [`mongodb`](https://www.npmjs.com/package/mongodb) | Default for services; full control, lighter weight |
| [Mongoose](https://www.npmjs.com/package/mongoose) | Team wants schemas, middleware, population; accept abstraction cost |

Pick **one** per service; do not mix both on the same collection without reason.

## Configuration

```javascript
// config/mongo.js
export const mongoConfig = {
  uri: process.env.MONGODB_URI,
  maxPoolSize: Number(process.env.MONGO_POOL_SIZE ?? 20),
  serverSelectionTimeoutMS: 10_000,
}
```

Validate `MONGODB_URI` at startup; fail fast if missing in production.

## Singleton client (official driver)

```javascript
// lib/mongo-client.js
import { MongoClient } from 'mongodb'
import { mongoConfig } from '../config/mongo.js'

let client

export async function getMongoClient() {
  if (client) return client
  client = new MongoClient(mongoConfig.uri, {
    maxPoolSize: mongoConfig.maxPoolSize,
  })
  await client.connect()
  return client
}

export function getDb() {
  if (!client) throw new Error('mongo_not_connected')
  return client.db() // or client.db('app')
}

export async function closeMongo() {
  if (!client) return
  await client.close()
  client = undefined
}
```

Register `closeMongo()` in the same graceful shutdown path as HTTP and Redis.

## Repository pattern

```javascript
// repositories/order-repository.js
import { ObjectId } from 'mongodb'
import { getDb } from '../lib/mongo-client.js'

const collection = () => getDb().collection('orders')

export async function findOrderById(id) {
  if (!ObjectId.isValid(id)) return null
  return collection().findOne(
    { _id: new ObjectId(id), deletedAt: null },
    { projection: { lines: 1, status: 1, userId: 1, totalCents: 1 } }
  )
}

export async function createOrder(doc) {
  const now = new Date()
  const result = await collection().insertOne({
    ...doc,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  })
  return result.insertedId
}
```

## Mongoose connection

```javascript
import mongoose from 'mongoose'
import { mongoConfig } from '../config/mongo.js'

export async function connectMongoose() {
  mongoose.set('strictQuery', true)
  await mongoose.connect(mongoConfig.uri, {
    maxPoolSize: mongoConfig.maxPoolSize,
  })
}

export async function disconnectMongoose() {
  await mongoose.disconnect()
}
```

- Define indexes in schema **and** ship migration scripts for production.
- Use `.lean()` for read-only list endpoints when not needing change tracking.

## Error handling

```javascript
import { MongoServerError } from 'mongodb'

export function mapMongoError(err) {
  if (err instanceof MongoServerError && err.code === 11000) {
    return { status: 409, code: 'duplicate_key' }
  }
  return { status: 500, code: 'database_error' }
}
```

Log full error server-side; return safe messages to clients.

## Transactions (short scope)

```javascript
const session = client.startSession()
try {
  await session.withTransaction(async () => {
    await orders.insertOne({ /* ... */ }, { session })
    await inventory.updateOne({ sku }, { $inc: { qty: -1 } }, { session })
  })
} finally {
  await session.endSession()
}
```

Keep transactions **short**; prefer single-document updates when sufficient.

## Testing

- **Unit:** mock repository interface.
- **Integration:** MongoDB testcontainer or ephemeral `memory-server` with isolated database name per test; drop DB in `afterEach`.

## Anti-patterns

- `new MongoClient()` per HTTP request.
- Passing raw `req.query` object into filter keys (`{ [userField]: value }` injection risk).
- Unhandled connection on startup (lazy connect without health check).
