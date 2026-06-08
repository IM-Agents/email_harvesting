# Node.js Folder Structure

Recommended structure for API services and workers.

## Standalone API service

```text
src/
  config/            # env parsing + typed config
  lib/               # logger, errors, http client, db pool, redis-client
  middleware/        # auth, validation, rate limit, request-id
  routes/            # route wiring only
  controllers/       # request/response mapping
  services/          # business use cases
  repositories/      # DB access
  jobs/              # async/background jobs
  events/            # pub/sub handlers
  types/             # shared service types
tests/
  integration/
  unit/
```

## Monorepo service

```text
apps/
  api-orders/
    src/...
packages/
  core-domain/       # pure domain rules, no HTTP/DB imports
  shared-config/
  shared-logger/
```

## Layering rules

- `routes` imports `controllers`, never repositories directly.
- `controllers` call `services`, not DB clients.
- `services` may call repositories and other services.
- `repositories` are the only layer touching SQL/ORM adapters.
- `core-domain` must stay framework-agnostic.

## Naming

- Files: `kebab-case` (`order-controller.js`).
- Classes: `PascalCase`.
- Functions/variables: `camelCase`.
- Folders: plural for collections (`services`, `repositories`).

## Operational files

- `src/config/index.js` validates all required env vars at startup.
- `src/lib/shutdown.js` holds graceful shutdown logic.
- `src/lib/errors.js` defines typed/structured operational errors.

## Why this structure

- Improves testability via clear seams.
- Avoids controller bloat and DB leakage into HTTP boundaries.
- Makes code generation by AI agents more consistent and reviewable.
