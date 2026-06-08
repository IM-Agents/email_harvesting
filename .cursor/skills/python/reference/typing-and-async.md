# Python Typing and Async

## Pydantic v2 (HTTP DTOs)

```python
from pydantic import BaseModel, Field, ConfigDict

class CreateOrderInput(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    user_id: str = Field(min_length=1)
    sku: str
    qty: int = Field(gt=0)

class OrderResponse(BaseModel):
    id: str
    status: str
    total_cents: int
```

- Infer service input from schemas; do not duplicate field lists manually.

## Type guards

```python
def is_non_empty_str(value: object) -> bool:
    return isinstance(value, str) and bool(value.strip())
```

## Async

```python
import asyncio
from collections.abc import Sequence

async def fetch_all(urls: Sequence[str]) -> list[bytes]:
    return await asyncio.gather(*[fetch_one(u) for u in urls])
```

Rules:

- Use **async drivers** (`asyncpg`, `httpx.AsyncClient`) inside `async def` routes.
- If only sync library exists, run in executor: `await asyncio.to_thread(blocking_fn, arg)`.
- Do not call blocking ORM in hot `async def` without offload.

## Generics

```python
from typing import TypeVar

T = TypeVar("T")

class Result[T]:
    def __init__(self, value: T | None, error: str | None = None) -> None:
        self.value = value
        self.error = error
```

## Anti-patterns

- `# type: ignore` without comment and ticket.
- `cast()` without validation at system boundaries.
- `async def` that only calls sync code with no concurrency benefit.
