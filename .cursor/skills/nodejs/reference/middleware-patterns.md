# Node.js Middleware Patterns

Middleware order and responsibilities for reliable APIs.

## Recommended pipeline order

1. Security headers
2. Body parser with size limits
3. Request ID assignment
4. Access logging
5. Authentication
6. Authorization
7. Input validation
8. Route handlers
9. Not-found handler
10. Central error middleware

## Rules

- Keep middleware single-purpose and composable.
- Do not perform business logic in middleware.
- Middleware should attach typed context (`req.user`, `req.id`) and pass control.
- Fail fast with explicit status and error code.

## Request ID middleware

```javascript
export function requestId(req, res, next) {
  req.id = req.get('x-request-id') || crypto.randomUUID();
  res.setHeader('x-request-id', req.id);
  next();
}
```

## Validation middleware

```javascript
export function validate(schema) {
  return (req, res, next) => {
    const parsed = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });
    if (!parsed.success) {
      return res.status(400).json({
        error: {
          code: 'validation_error',
          message: 'Invalid request',
          requestId: req.id,
        },
      });
    }
    req.validated = parsed.data;
    next();
  };
}
```

## Error middleware

```javascript
export function errorMiddleware(err, req, res, next) {
  const status = err.status || 500;
  req.log?.error({ err, requestId: req.id });
  res.status(status).json({
    error: {
      code: err.code || 'internal_error',
      message: status >= 500 ? 'Internal Server Error' : err.message,
      requestId: req.id,
    },
  });
}
```

## Anti-patterns

- Async middleware without `try/catch` or centralized `asyncHandler`.
- Swallowing errors and returning generic success responses.
- Mutating unrelated request fields from many middleware functions.
