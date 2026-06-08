---
name: python-standards
description: Python 3.11+ standards for structure, typing, async, security, FastAPI/Django APIs, SQLAlchemy, and pytest. Use when writing or reviewing Python, .py files, pyproject.toml, workers, or data scripts.

---

# Python Standards

**Audience:** engineers and code-generating agents. **Goal:** readable, typed, testable Python for APIs and backend services.

**Runtime:** target **Python 3.11+** unless the repo pins an LTS. Use a single dependency manager per repo (**uv**, **Poetry**, or **pip + venv**).

## 1. Project shape

```
src/
  myapp/
    api/              # routes / views
    services/         # use cases
    repositories/     # DB access
    models/           # domain / ORM models
    schemas/          # Pydantic DTOs
tests/
pyproject.toml
.env.example
```

- **Layers:** route → service → repository. **No raw SQL in route handlers.**
- **Config:** environment via `pydantic-settings` or framework settings; validate at startup.
- **Entry:** `__main__.py`, ASGI app factory, or `manage.py`—one clear bootstrap per deployable.

Detail: [reference/folder-structure.md](reference/folder-structure.md).

## 2. Style and naming (PEP 8)

| Kind | Convention | Example |
|------|------------|---------|
| Modules, packages | `snake_case` | `order_service.py` |
| Classes | `PascalCase` | `OrderService` |
| Functions, variables | `snake_case` | `get_order_by_id` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_RETRIES` |
| Private | leading `_` | `_cache` |

- **4 spaces** indentation; **88** char line length if using Black/Ruff default.
- Imports: stdlib → third-party → local; no wildcard `from foo import *`.
- Docstrings on public modules/classes/functions (Google or NumPy style—pick one per repo).

## 3. Typing

- Type hints on **all public** functions and methods; enable **`mypy`** or **`pyright`** in CI.
- Prefer **`list[str]`**, **`dict[str, int]`** (3.9+ builtins) over `List`, `Dict` from `typing`.
- Use **`X | None`** instead of `Optional[X]` in new code (3.10+).
- **`TypedDict`**, **`Protocol`**, and **`dataclass`** / **`@dataclass(frozen=True)`** for structured data.
- Avoid bare `Any`; use `object` or generics at boundaries.

Detail: [reference/typing-and-async.md](reference/typing-and-async.md).

## 4. Errors and logging

- Raise **specific exceptions** (`OrderNotFoundError`); map to HTTP in one exception handler (FastAPI) or middleware.
- Never bare `except:`; catch `Exception` only at outer boundaries with logging.
- Use **`logging`** (or structlog) with JSON in production; include `request_id`, never secrets or full PAN.

```python
logger.exception("order_create_failed", extra={"order_id": order_id})
```

## 5. Database access

- **SQLAlchemy 2.0** style or ORM query APIs with **bound parameters**—never f-string SQL with user input.
- **Never `SELECT *`**—list only columns needed for the use case.
- Repositories own queries; return domain objects or Pydantic models, not ORM instances past service boundary when avoidable.
- Use transactions for multi-step writes (`session.begin()` / `atomic()` in Django).

See [../mysql/SKILL.md](../mysql/SKILL.md), [../postgresql/SKILL.md](../postgresql/SKILL.md), [../mongodb/SKILL.md](../mongodb/SKILL.md).

## 6. HTTP APIs

- Validate request bodies with **Pydantic v2** models (`BaseModel`, `Field`).
- Consistent JSON errors: `{"error": {"code": "...", "message": "..."}}`.
- Correct status codes; **keyset/cursor pagination** for large lists.
- Async endpoints only when I/O-bound; do not mix blocking DB calls in `async def` without `asyncio.to_thread` or async driver.

Framework patterns: [reference/framework-patterns.md](reference/framework-patterns.md).

## 7. Security

- Secrets in env / secret manager—never in repo.
- Parameterized queries; escape/sanitize only at the right layer (templates, shell).
- Passwords: **argon2** or **bcrypt** via `passlib` / framework helpers.
- Pin dependencies; run **`pip-audit`** or **`uv pip audit`** in CI.

Checklist: [reference/security-performance.md](reference/security-performance.md).

## 8. Testing

- **pytest** for unit and integration tests; `pytest-asyncio` for async code.
- Structure: `tests/unit/`, `tests/integration/`; fixtures in `conftest.py`.
- Mock external I/O at service boundaries; use test DB or containers for integration.
- Name tests `test_<behavior>_<condition>`.

## 9. Tooling

| Tool | Purpose |
|------|---------|
| **Ruff** | lint + import sort (replaces flake8/isort) |
| **Black** or Ruff format | formatting |
| **mypy** / **pyright** | static types |
| **pytest** | tests |

Commit lockfile (`uv.lock`, `poetry.lock`) or `requirements.txt` with hashes when policy requires.

## Anti-patterns

- Mutable default arguments (`def f(items=[]):`).
- Global mutable singletons without tests.
- Blocking `time.sleep` in async request handlers.
- `pickle` on untrusted data; `eval` / `exec` on user input.
- `SELECT *` or string-built SQL.
- Catching and swallowing exceptions without log.

## Cross-references

- Node.js comparison: [../nodejs/SKILL.md](../nodejs/SKILL.md)
- PHP comparison: [../php/SKILL.md](../php/SKILL.md)
- Reference: [reference/README.md](reference/README.md)
