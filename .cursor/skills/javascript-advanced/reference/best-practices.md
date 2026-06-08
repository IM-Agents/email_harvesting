# JavaScript Best Practices

Practical checklist for daily coding and code review.

## Naming and readability

- Use descriptive names (`calculateInvoiceTotal`, not `calc`).
- Boolean names should read as predicates (`isReady`, `hasAccess`).
- Keep function signatures small and explicit.

## Function design

- Prefer small functions with one responsibility.
- Return early to reduce nested conditionals.
- Avoid >3 levels of nesting.

```javascript
export function getDiscount(user) {
  if (!user) return 0;
  if (!user.isActive) return 0;
  if (user.plan === 'pro') return 20;
  return 5;
}
```

## Data handling

- Use `const` by default, `let` when needed, never `var`.
- Use `===`/`!==` to avoid implicit coercion bugs.
- Normalize incoming external data before business logic.

## Async best practices

- Always handle promise rejection paths.
- Batch independent async operations with `Promise.all`.
- Add retries only for retry-safe operations.

## Logging and observability

- Use structured logs with keys (`requestId`, `userId`, `operation`).
- Log actionable error context; avoid dumping sensitive payloads.
- Add metrics/traces for expensive or critical flows.

## Code organization

- Group by feature/domain, not by random utility types.
- Keep shared helpers in focused modules.
- Delete dead code quickly to reduce maintenance burden.

## Review checklist

- [ ] Input validation exists at boundary
- [ ] Errors are handled and observable
- [ ] Async flow is bounded and safe
- [ ] Naming and structure are clear
- [ ] Tests cover important paths
