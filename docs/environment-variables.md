# Environment Variables

## Credential Management Rules

- All third-party credentials must be provided through environment variables.
- Credentials must not be stored in source code.
- Credentials must not be stored in the database.
- Credentials should not be returned through API responses.
- Logs must mask credential values.

## Required Environment Variables

### Snov.io

```env
SNOV_EMAIL=
SNOV_PASSWORD=
```

Set real Snov.io credentials in gitignored `{monorepo}/.env` only — not in committed files.

### Apollo

```env
APOLLO_EMAIL=
APOLLO_PASSWORD=
```

Set real Apollo credentials in gitignored `{monorepo}/.env` only.

### LinkedIn

```env
LINKEDIN_EMAIL=
LINKEDIN_PASSWORD=
```

Set real LinkedIn credentials in gitignored `{monorepo}/.env` only.

### Browser Automation

```env
HEADLESS=true
BROWSER_TIMEOUT=30000
```

### Proxy Configuration

```env
PROXY_ENABLED=true
PROXY_HOST=
PROXY_PORT=
PROXY_USERNAME=
PROXY_PASSWORD=
```

### Application

```env
APP_ENV=
APP_URL=
```

## Recommended Additional Environment Variables

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=mysql://user:password@host:3306/email_harvesting
REDIS_URL=redis://host:6379
S3_ENDPOINT=
S3_BUCKET=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
JWT_SECRET=
WORKER_COUNT=10
MAX_PAGES_PER_DOMAIN=10
MIN_CONTACTS_PER_DOMAIN=2
RETRY_BACKOFF_SECONDS=30,60,120
```

## Secret Handling Requirements

- Use a secret manager in staging and production.
- Use `.env` only for local development.
- Add `.env` to `.gitignore`.
- Mask secrets in logs and UI.
- Rotate credentials if exposed.
