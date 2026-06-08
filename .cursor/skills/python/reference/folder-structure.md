# Python Folder Structure

## src layout (recommended)

```
pyproject.toml
src/
  myapp/
    __init__.py
    main.py             # FastAPI app or CLI entry
    api/
      routes/
      deps.py           # Depends(), auth
    services/
    repositories/
    models/             # SQLAlchemy ORM
    schemas/            # Pydantic DTOs
    core/
      config.py
      logging.py
tests/
  conftest.py
  unit/
  integration/
```

## FastAPI

```
src/myapp/
  main.py
  api/v1/orders.py
  services/order_service.py
  repositories/order_repo.py
  schemas/order.py
```

```python
# main.py
from fastapi import FastAPI
from myapp.api.v1 import orders

app = FastAPI(title="My API")
app.include_router(orders.router, prefix="/api/v1")
```

## Django

```
myproject/
  settings/
  urls.py
apps/
  orders/
    models.py
    views.py
    services.py
    repositories.py
manage.py
```

- Business logic in **services**; keep views thin.
- Use **migrations** for schema; never hand-edit prod DB without migration.

## Scripts and jobs

- One-off scripts under `scripts/` (not imported as package root).
- Workers/Celery tasks in `workers/` or `tasks/` with same service/repository layers.

## Anti-patterns

- Giant `utils.py` imported everywhere.
- ORM models imported directly in route handlers for complex queries.
- Tests inside `src/` without `tests/` mirror.
