---
name: php-standards
description: Modern PHP 8+ standards for structure, typing, security, Composer, PDO, and Laravel/Symfony patterns. Use when writing or reviewing PHP, .php files, Composer packages, PHPUnit tests, or PHP APIs and background jobs.

---

# PHP Standards

**Audience:** engineers and code-generating agents. **Goal:** secure, typed, maintainable PHP 8.2+.

**Runtime:** target **PHP 8.2+** unless the repo documents an older LTS. Enable `strict_types=1` in new files.

## 1. Project shape

- **Autoload:** PSR-4 via Composer (`App\` → `src/`).
- **Public web root:** only `public/index.php` (or `public/`) is web-accessible; never expose `src/`, `vendor/`, `.env`.
- **Layers:** HTTP (controller) → application/service → repository/infra. **No SQL or `$_POST` in controllers beyond DTO mapping.**
- **Config:** environment via `$_ENV` / `getenv()` or framework config; validate required keys at bootstrap.

```
src/
  Http/Controllers/
  Application/Services/
  Domain/
  Infrastructure/Repositories/
config/
public/index.php
tests/
```

Detail: [reference/folder-structure.md](reference/folder-structure.md).

## 2. Naming and style

| Kind | Convention | Example |
|------|------------|---------|
| Classes, enums, traits | `PascalCase` | `OrderService` |
| Methods, properties | `camelCase` | `findById` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_ATTEMPTS` |
| Namespaces | `Psr4\Module\Class` | `App\Order\OrderService` |
| Files | match class name | `OrderService.php` |

- One class per file; filename matches class.
- Prefer **constructor injection**; avoid service locators and global state.
- Use `declare(strict_types=1);` at top of new PHP files.

## 3. Types and language features (PHP 8+)

- Type **parameters**, **return types**, and **property types** on all public APIs.
- Use **`?Type`** and **`Type|null`** consistently (pick union style per repo).
- Prefer **`readonly`** properties and **constructor promotion** for immutable DTOs.
- Use **`enum`** for fixed sets instead of string magic values.
- Use **`match`** over long `switch` when exhaustive.
- Avoid `@` error suppression; handle exceptions explicitly.

```php
<?php

declare(strict_types=1);

namespace App\Order;

enum OrderStatus: string
{
    case Pending = 'pending';
    case Paid = 'paid';
    case Cancelled = 'cancelled';
}
```

## 4. Error handling

- Throw **domain exceptions** from services; map to HTTP responses in a single exception listener/handler.
- Use `Throwable` only at outer boundaries; never empty `catch` blocks.
- Log with context (request ID, user ID); never log passwords, tokens, or full card data.

## 5. Database access

- **PDO or query builder** with **bound parameters only**—never interpolate user input into SQL.
- **List only needed columns** in every `SELECT`—never use `SELECT *`.
- Repositories own queries; return DTOs or domain models, not raw `PDOStatement` to controllers.
- Transactions wrap multi-step writes in services.

See [../mysql/SKILL.md](../mysql/SKILL.md) / [../postgresql/SKILL.md](../postgresql/SKILL.md) for engine-specific rules.

## 6. HTTP and APIs

- Validate input with dedicated request DTOs or framework form requests.
- Respond with consistent JSON: `{ "data": ... }` or `{ "error": { "code", "message" } }`.
- Set correct status codes; use **idempotency keys** for retry-safe POST when needed.
- Pagination: cursor/keyset for large tables.

## 7. Security baseline

- Output encode for HTML: `htmlspecialchars($s, ENT_QUOTES, 'UTF-8')` or template engine auto-escape.
- Passwords: `password_hash()` / `password_verify()` only (PASSWORD_DEFAULT).
- CSRF on state-changing cookie sessions; SameSite cookies.
- File uploads: validate MIME/size/extension; store outside web root.
- Dependencies: `composer audit` in CI; pin lockfile.

Full checklist: [reference/security-performance.md](reference/security-performance.md).

## 8. Composer and dependencies

- Commit `composer.lock`; run `composer install` in deploy (not open-ended `update`).
- Prefer small, maintained packages; avoid copying vendor code.
- Scripts: `composer test`, `composer lint` documented in README.

## 9. Testing

- **PHPUnit** (or Pest) for unit + integration tests.
- Unit-test services with mocked repositories; integration tests use real DB in Docker or sqlite.
- Name tests `test_{behavior}_{condition}` or use `@test` attributes; one assertion focus per test when practical.

## 10. Frameworks

| Framework | Guidance |
|-----------|----------|
| **Laravel** | Form requests, policies, Eloquent scopes, queues, config cache in prod |
| **Symfony** | DI autowire, validators, Doctrine repositories, Messenger for async |

Framework-specific patterns: [reference/framework-patterns.md](reference/framework-patterns.md).

## Anti-patterns

- `SELECT *` or unbounded column fetches; `mysql_*` / string-concat SQL; `eval`, `exec`, `shell_exec` with user input.
- Business logic in Blade/templates or global functions in `helpers.php` without tests.
- `extract()` on untrusted arrays; unserialize user input.
- Suppressing errors with `@`; leaking stack traces in production JSON.
- Storing secrets in repo or `config/*.php` committed with real credentials.

## Cross-references

- JavaScript (shared API clients): [../javascript-advanced/SKILL.md](../javascript-advanced/SKILL.md)
- Node.js BFF comparison: [../nodejs/SKILL.md](../nodejs/SKILL.md)
- MySQL / PostgreSQL: [../mysql/SKILL.md](../mysql/SKILL.md), [../postgresql/SKILL.md](../postgresql/SKILL.md)
- Reference index: [reference/README.md](reference/README.md)
