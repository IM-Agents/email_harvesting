# JavaScript Advanced Standards

Advanced ES6+ guidance for performance, reliability, and maintainability.

## 1) Architecture and module boundaries

- Keep domain modules pure; isolate I/O behind adapters.
- Avoid circular imports; split shared contracts into dedicated modules.
- Expose narrow module APIs and hide internal helpers.

## 2) Async and concurrency discipline

- Use `async`/`await` for readability; avoid long promise chains.
- Use bounded concurrency for large workloads.
- Always set timeout/cancel behavior for network calls.
- Avoid accidental sequential `await` when tasks are independent.

## 3) Error taxonomy

- Differentiate operational errors (retryable) from programmer errors (fix code).
- Wrap external errors with context using `{ cause }`.
- Never swallow errors silently.

```javascript
try {
  await client.send(payload);
} catch (err) {
  throw new Error('Failed to publish event', { cause: err });
}
```

## 4) Performance in hot paths

- Avoid repeated object allocations in tight loops.
- Prefer `Map`/`Set` for heavy key-based lookups.
- Use streaming APIs for large payloads/files.
- Avoid expensive JSON parse/stringify cycles unless required.

## 5) Immutable by default

- Treat shared data as immutable at boundaries.
- Prefer pure transformers over in-place mutation for shared objects.
- If mutating for performance, keep mutation local and documented.

## 6) API and DTO shaping

- Validate inputs at boundaries.
- Keep DTOs explicit; avoid leaking internal model shape directly.
- Avoid loosely typed “bag objects” as function params.

## 7) Security hygiene

- Never interpolate user input into shell/SQL/HTML contexts.
- Validate and sanitize at boundary.
- Keep secrets out of source and logs.

## 8) Tooling baseline

- Linting + formatting in CI.
- Unit tests for pure logic, integration tests for I/O.
- Track bundle/runtime regressions for critical modules.

## 9) Anti-patterns

- Global mutable singleton state.
- Utility “god files” with unrelated functions.
- Hidden side effects in imports.
- Overuse of dynamic typing tricks that reduce readability.
