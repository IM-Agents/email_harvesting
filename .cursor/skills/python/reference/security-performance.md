# Python Security and Performance

## SQL (MUST)

```python
# ✅ GOOD — explicit columns + parameters
stmt = select(User.id, User.email).where(User.email == email)
session.execute(stmt)

# SQLAlchemy Core
session.execute(
    text("SELECT id, email FROM users WHERE email = :email"),
    {"email": email},
)

# ✗ BAD
session.execute(text(f"SELECT * FROM users WHERE email = '{email}'"))
```

## Security

| Area | Rule |
|------|------|
| Secrets | Env / vault only; use `pydantic-settings` |
| Passwords | argon2/bcrypt; never plain text |
| Shell | `subprocess` with list args, no `shell=True` with user input |
| Pickle | Never unpickle untrusted bytes |
| CORS | Explicit origins in APIs; no `*` with credentials |
| Dependencies | Audit in CI (`pip-audit`, `uv pip audit`) |

## Performance (SHOULD)

- Profile before optimizing (`py-spy`, APM).
- Connection pooling for DB (`pool_size`, `max_overflow` documented).
- Batch inserts/updates in transactions.
- Cache with TTL + invalidation (Redis)—see [../../nodejs/reference/redis.md](../../nodejs/reference/redis.md).
- Generator/stream large exports; do not load full tables into memory.

## Logging

```python
import logging

logger = logging.getLogger(__name__)

logger.info("order_created", extra={"order_id": order_id, "request_id": request_id})
```

- Structured fields in `extra` or structlog bindings.
- `logger.exception` in handlers for 500 paths.

## Production checklist

- [ ] `DEBUG=False` (Django) / no stack traces in JSON responses
- [ ] Gunicorn/Uvicorn workers sized for CPU/memory
- [ ] Health check endpoint for orchestrator
- [ ] Timeouts on outbound HTTP (`httpx.Timeout`)
