# Node.js API Standards Design

**Scope:** HTTP API contracts, versioning, error shapes, idempotency, pagination, and observability.

## 1) Endpoint design

- Use resource-oriented URLs: `/users`, `/users/{id}`, `/orders/{id}/items`.
- Prefer nouns for paths, verbs for actions only when required (`/jobs/{id}:retry`).
- Keep mutating endpoints idempotent where clients may retry.

## 2) Versioning

- Default to URI versioning for public APIs: `/v1/...`.
- For internal services, version only on breaking changes.
- Maintain backward compatibility for at least one prior major API version.

## 3) Request validation

- Validate at edge (middleware) using schema libraries.
- Reject unknown fields when strict contracts are needed.
- Return validation failures as `400` with field-level detail.

```json
{
  "error": {
    "code": "validation_error",
    "message": "Invalid request body",
    "details": [
      { "field": "email", "reason": "must be valid email" }
    ],
    "requestId": "req_123"
  }
}
```

## 4) Error model (standard shape)

- Keep one JSON envelope for all errors.
- Never expose stack traces in production responses.
- Map domain errors to deterministic status codes.

| Status | Code | Meaning |
|---|---|---|
| `400` | `validation_error` | malformed or invalid input |
| `401` | `unauthorized` | missing/invalid auth |
| `403` | `forbidden` | authenticated but denied |
| `404` | `not_found` | resource missing |
| `409` | `conflict` | uniqueness/version conflict |
| `422` | `unprocessable_entity` | semantic business rule failure |
| `429` | `rate_limited` | too many requests |
| `500` | `internal_error` | unexpected server failure |

## 5) Pagination and filtering

- Prefer cursor/keyset pagination for large datasets.
- Include stable sort key(s) in cursor.
- Use explicit limits with safe max caps.

```json
{
  "data": [{ "id": "o_1" }],
  "page": {
    "nextCursor": "eyJpZCI6Im9fMSJ9",
    "hasMore": true
  }
}
```

## 6) Idempotency for write APIs

- Require `Idempotency-Key` for retry-prone POST operations (payments, external calls).
- Store request hash + response for key TTL window.
- Return prior successful response when same key and same payload are replayed.

## 7) Observability and SLO alignment

- Attach `requestId` to all logs, errors, and traces.
- Emit latency histograms by route and status class.
- Track p95/p99 latency and error rate per endpoint.

## 8) Security defaults

- Enforce authz per endpoint, not only at route group level.
- Apply rate limits to public and expensive endpoints.
- Redact PII from logs and error details.

## 9) Minimal route example

```javascript
router.post('/v1/orders', asyncHandler(async (req, res) => {
  const input = createOrderSchema.parse(req.body);
  const order = await orderService.create(input, {
    idempotencyKey: req.get('Idempotency-Key'),
  });
  res.status(201).json({ data: order });
}));
```
