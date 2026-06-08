# PHP — reference

**Canonical standard:** [../SKILL.md](../SKILL.md)  
**Suite index:** [../../SKILL.md](../../SKILL.md)

## Additional reference files

- [folder-structure.md](folder-structure.md) — PSR-4 layout, plain PHP vs Laravel/Symfony.
- [security-performance.md](security-performance.md) — OWASP-oriented checklist, PDO, sessions, caching.
- [framework-patterns.md](framework-patterns.md) — Laravel and Symfony conventions.

## Composer scripts (example)

```json
{
  "scripts": {
    "test": "phpunit",
    "lint": "php-cs-fixer fix --dry-run --diff",
    "stan": "phpstan analyse"
  }
}
```

## Local development

- Use **Docker** or `php -S localhost:8000 -t public` only for local smoke tests—not production.
- Document `APP_ENV`, `APP_DEBUG=false` in production, and DB DSN in `.env.example`.

## Checklist

- [ ] `declare(strict_types=1)` on new files
- [ ] PSR-4 autoload; `public/` is sole web root
- [ ] Prepared statements only; repositories own SQL
- [ ] No `SELECT *`—explicit column lists only
- [ ] Central exception → HTTP mapping
- [ ] `composer.lock` committed; audit in CI
- [ ] PHPUnit/Pest covers services and critical HTTP paths
