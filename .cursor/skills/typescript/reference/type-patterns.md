# TypeScript Type Patterns

## Prefer unions over enum (default)

```typescript
type OrderStatus = 'pending' | 'paid' | 'cancelled'

function isPaid(status: OrderStatus): boolean {
  return status === 'paid'
}
```

Use `enum` only when numeric values or legacy interop require it.

## Discriminated unions

```typescript
type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string } }

function handle<T>(result: ApiResult<T>): T {
  if (!result.ok) throw new Error(result.error.message)
  return result.data
}
```

## Type guards

```typescript
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function isOrder(value: unknown): value is Order {
  return isRecord(value) && typeof value.id === 'string' && typeof value.totalCents === 'number'
}
```

## Zod at boundaries

```typescript
import { z } from 'zod'

export const createOrderSchema = z.object({
  userId: z.string().uuid(),
  lines: z.array(z.object({
    sku: z.string().min(1),
    qty: z.number().int().positive(),
  })).min(1),
})

export type CreateOrderInput = z.infer<typeof createOrderSchema>
```

## Generics

```typescript
export async function fetchJson<T>(
  url: string,
  schema: z.ZodType<T>,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return schema.parse(await res.json())
}
```

## Utility types (use deliberately)

| Type | Use |
|------|-----|
| `Partial<T>` | Optional updates |
| `Pick` / `Omit` | DTO subsets |
| `Readonly<T>` | Immutable views |
| `Record<K, V>` | Maps with known keys |
| `NonNullable<T>` | After null check |

Avoid deep `Partial` on large domain models—define explicit update DTOs.

## `satisfies` vs assertion

```typescript
// ✅ preserves literal keys, checks against AppConfig
const routes = {
  home: '/',
  orders: '/orders',
} satisfies Record<string, string>

// ✗ loses literal inference or bypasses checks
const routes = { home: '/', orders: '/orders' } as AppConfig
```

## Anti-patterns

- `as any` to silence compiler.
- `!` non-null assertion without prior guard.
- Optional everything (`?`) on domain entities that are always required when persisted.
