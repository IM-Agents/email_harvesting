# PHP Framework Patterns

## Laravel

### Controller + Form Request

```php
<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\StoreOrderRequest;
use App\Services\OrderService;
use Illuminate\Http\JsonResponse;

final class OrderController
{
    public function __construct(private readonly OrderService $orders) {}

    public function store(StoreOrderRequest $request): JsonResponse
    {
        $order = $this->orders->create($request->validated());
        return response()->json(['data' => $order], 201);
    }
}
```

### Rules

- **Policies** for authorization; gates for simple checks.
- **Eloquent:** `$fillable` or `$guarded`; never pass raw `request()->all()` to `create()`.
- **API resources** for stable JSON shapes; hide internal IDs when using public UUIDs.
- **Queues:** implement `ShouldQueue` for slow work; idempotent `handle()` when retries possible.
- **Migrations:** reversible when feasible; index foreign keys.

### Config

- `config:cache`, `route:cache`, `view:cache` in deploy pipeline.
- Use `.env` for secrets; `config()` in code, not `env()` outside config files in production.

## Symfony

### Controller + DI

```php
<?php

declare(strict_types=1);

namespace App\Controller;

use App\Service\OrderService;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

final class OrderController
{
    public function __construct(private readonly OrderService $orders) {}

    #[Route('/api/orders', methods: ['POST'])]
    public function store(Request $request): JsonResponse
    {
        // validate via ValidatorInterface or DTO + MapRequestPayload
        $order = $this->orders->create(/* dto */);
        return new JsonResponse(['data' => $order], 201);
    }
}
```

### Rules

- **Autowire** services; bind interfaces in `services.yaml`.
- **Doctrine:** DQL/QueryBuilder with parameters; migrations via Doctrine Migrations.
- **Messenger:** async handlers for side effects; validate message DTOs.
- **Security:** voters for object-level auth; firewall for API JWT/session.

## Shared API patterns (both frameworks)

- Version APIs (`/api/v1/...`).
- Consistent error body: `{ "error": { "code": "...", "message": "..." } }`.
- Health check route without auth for load balancers.

## Anti-patterns

- `SELECT *` or Eloquent/Doctrine fetches without explicit column/projection lists.
- Raw `DB::select("... $id")` or `$em->createQuery("... $id")` string concat.
- `dd()` / `dump()` left in committed code.
- Synchronous cURL in request cycle for slow third parties (use queue + timeout).
