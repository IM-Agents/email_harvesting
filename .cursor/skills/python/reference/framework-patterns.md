# Python Framework Patterns

## FastAPI

```python
from fastapi import APIRouter, Depends, HTTPException, status
from myapp.schemas.order import CreateOrderInput, OrderResponse
from myapp.services.order_service import OrderService
from myapp.api.deps import get_order_service

router = APIRouter(prefix="/orders", tags=["orders"])

@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    body: CreateOrderInput,
    service: OrderService = Depends(get_order_service),
) -> OrderResponse:
    try:
        return await service.create(body)
    except OrderNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
```

- Dependencies for DB session and auth.
- Global exception handlers map domain errors to JSON.

## Django REST (optional)

- Serializers validate input; views call services.
- Use `select_related` / `prefetch_related` to avoid N+1.

## SQLAlchemy 2.0 (repository)

```python
from sqlalchemy import select
from sqlalchemy.orm import Session

def get_order_by_id(session: Session, order_id: str) -> Order | None:
    stmt = select(Order.id, Order.status, Order.total_cents).where(Order.id == order_id)
    row = session.execute(stmt).first()
    if row is None:
        return None
    return Order(id=row.id, status=row.status, total_cents=row.total_cents)
```

- Explicit column list in `select()`—no `select(Order)` when only subset needed unless full model required.

## Background tasks

- **Celery** / **RQ** / framework `BackgroundTasks` for slow IO—do not block HTTP response on email/webhooks.

## Anti-patterns

- Raw SQL f-strings: `f"SELECT * FROM orders WHERE id = {id}"`.
- Returning ORM models with lazy relations from async routes without eager load.
- Business logic duplicated in serializers and services.
