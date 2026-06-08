# MongoDB — reference

**Canonical standard:** [../SKILL.md](../SKILL.md)  
**Suite index:** [../../SKILL.md](../../SKILL.md)

## Additional reference files

- [schema-design.md](schema-design.md) — embed vs reference, validation, document patterns.
- [node-driver.md](node-driver.md) — official `mongodb` driver and Mongoose with Node.js.
- [query-indexing.md](query-indexing.md) — indexes, aggregation, pagination, transactions.

## Migrations & repo layout

```
db/
  migrations/
    mongodb/
      20250101000000-add-orders-index.js
src/
  config/
    mongo.js
  lib/
    mongo-client.js
  repositories/
    order-repository.js
```

- **Forward-only** migrations in CI; document rollback runbooks.
- Keep Mongo migrations **separate** from SQL (`mysql/` / `postgresql/`).

## Local development

```yaml
# docker-compose excerpt
services:
  mongo:
    image: mongo:7
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: root
      MONGO_INITDB_ROOT_PASSWORD: devonly
```

`MONGODB_URI=mongodb://root:devonly@localhost:27017/app?authSource=admin` in `.env.example` (never commit real secrets).

## Quick checklist

- [ ] Embed vs reference decision documented per collection
- [ ] Indexes match production query shapes (`explain` reviewed)
- [ ] Single `MongoClient` per process; closed on shutdown
- [ ] Projections on hot reads; keyset pagination
- [ ] App DB user least privilege; TLS in production
