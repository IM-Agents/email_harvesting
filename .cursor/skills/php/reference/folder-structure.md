# PHP Folder Structure

## Plain PHP (API or microservice)

```
project/
  public/
    index.php          # front controller only
  src/
    Http/
      Controllers/
    Application/
      Services/
    Domain/
      Models/          # entities, value objects
    Infrastructure/
      Repositories/
  config/
    app.php
    database.php
  tests/
    Unit/
    Integration/
  composer.json
  .env.example
```

**Bootstrap (`public/index.php`):**

```php
<?php

declare(strict_types=1);

require dirname(__DIR__) . '/vendor/autoload.php';

$app = App\Bootstrap\createApplication();
$app->run();
```

## Laravel (default layout)

```
app/
  Http/Controllers/
  Http/Requests/
  Models/
  Services/
routes/
  api.php
  web.php
config/
database/migrations/
tests/Feature/
tests/Unit/
```

- Keep controllers thin; use **Form Requests** for validation.
- Business rules in **Services** or **Actions**; avoid fat models when they grow past persistence.

## Symfony

```
src/
  Controller/
  Entity/
  Repository/
  Service/
config/
  packages/
  routes.yaml
migrations/
tests/
```

- Controllers as invokable classes or attributes; inject services via constructor.
- Doctrine entities in `src/Entity/`; custom queries in repositories.

## Naming

- One namespace segment per directory level (`App\Order\OrderService`).
- Test namespace mirrors source: `Tests\Unit\Order\OrderServiceTest`.

## Anti-patterns

- `public/` containing `src/` or `vendor/` copies.
- SQL files executed from views.
- God object `functions.php` imported everywhere without autoload discipline.
