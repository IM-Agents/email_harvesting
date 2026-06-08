# PHP Security and Performance

## Security (MUST)

| Area | Rule |
|------|------|
| SQL | PDO prepared statements or ORM bindings only |
| XSS | Escape output; CSP headers on HTML apps |
| CSRF | Token on cookie-session forms and state-changing routes |
| Auth | `password_hash` / `password_verify`; rate-limit login |
| Sessions | `httponly`, `secure`, `samesite`; regenerate ID on login |
| Files | Whitelist extensions; random stored names; outside `public/` |
| Secrets | `.env` not committed; rotate keys via secrets manager |
| Headers | `X-Frame-Options`, `X-Content-Type-Options`, HSTS at edge |

```php
// ✅ GOOD — needed columns only + bound parameter
$stmt = $pdo->prepare('SELECT id, email, created_at FROM users WHERE email = :email');
$stmt->execute(['email' => $email]);

// ✗ BAD
$pdo->query("SELECT * FROM users WHERE email = '$email'");
$stmt = $pdo->prepare('SELECT * FROM users WHERE email = :email');
```

```php
// ✅ GOOD — password
$hash = password_hash($plain, PASSWORD_DEFAULT);
password_verify($plain, $hash);
```

## Input validation

- Validate at HTTP boundary (Form Request / Symfony Validator).
- Use `filter_var` for emails/URLs when not using a validator component.
- Reject unexpected fields (allowlist DTO properties).

## Performance (SHOULD)

- Enable **OPcache** in production; deploy with `opcache.validate_timestamps=0` when using immutable releases.
- Avoid N+1: eager-load relations (`with()` in Laravel, `join`/`fetch` in Doctrine).
- Cache expensive reads (Redis/file) with explicit TTL and invalidation—see [../../nodejs/reference/redis.md](../../nodejs/reference/redis.md) if sharing Redis with Node services.
- Use queues (Laravel Horizon, Symfony Messenger) for email, webhooks, heavy IO.
- Profile with Xdebug only locally; use APM (Blackfire, Datadog) in staging.

## Logging

- Structured JSON logs (Monolog) with `request_id`, `user_id`.
- Levels: `error` for failures needing action, `info` for business events, `debug` sampled in prod.

## Production checklist

- [ ] `display_errors=Off`, `log_errors=On`
- [ ] `APP_DEBUG=false` (Laravel) / `kernel.debug=false` (Symfony)
- [ ] HTTPS only; secure cookies
- [ ] `composer install --no-dev --optimize-autoloader`
- [ ] Dependency audit in CI
