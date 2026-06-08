# Plan: Email Harvesting & Contact Discovery Platform

## Requirements (sources)
- README/docs: `docs/README.md`, `docs/frontend-requirements.md`, `docs/api-endpoints.md`, `docs/database-schema.md`, `docs/environment-variables.md`
- User: Figma page-wise design, full stack implementation, test cases, code review

## Project layout
- `{frontend_app}`: `apps/web` (React 18 + webpack SPA)
- `{backend_app}`: `apps/api` (Node.js Express + MySQL + Knex)
- `{db_name}`: `email_harvesting_app`

## Technology stack
| Tech | Source | Rule/skill |
|------|--------|------------|
| React 18 | docs/README.md | react-stack.mdc |
| Node.js 24 | docs/README.md | nodejs-stack.mdc |
| MySQL 8+ | docs/README.md | mysql-stack.mdc |
| webpack 5 | architecture.mdc | architecture skill |
| Turborepo | architecture.mdc | architecture skill |
| Playwright | docs (workers) | Phase 2 stub |

## Environment variables
| Variable | Value | Project env layer | Purpose |
|----------|-------|-------------------|---------|
| SNOV_EMAIL | from docs | packages/config | Snov.io login |
| SNOV_PASSWORD | from docs | packages/config | Snov.io login |
| APOLLO_EMAIL | from docs | packages/config | Apollo login |
| APOLLO_PASSWORD | from docs | packages/config | Apollo login |
| LINKEDIN_EMAIL | from docs | packages/config | LinkedIn login |
| LINKEDIN_PASSWORD | from docs | packages/config | LinkedIn login |
| HEADLESS | true | packages/config | Browser automation |
| BROWSER_TIMEOUT | 30000 | packages/config | Browser timeout |
| PROXY_* | from docs | packages/config | Proxy config |
| DB_* | email_harvesting_app | packages/config | MySQL |
| JWT_SECRET | — | packages/config | Auth tokens |
| REDIS_URL | — | packages/config | Queue (Phase 2) |

## Feature index
| Order | Slug | File | Depends on | Status |
|-------|------|------|------------|--------|
| 1 | figma-design | plan/features/figma-design.md | — | in_progress |
| 2 | foundation | plan/features/foundation.md | — | planned |
| 3 | auth-api | plan/features/auth-api.md | foundation | planned |
| 4 | batch-upload | plan/features/batch-upload.md | auth-api | planned |
| 5 | frontend-pages | plan/features/frontend-pages.md | batch-upload | planned |
| 6 | test-cases | plan/features/test-cases.md | frontend-pages | planned |

## Milestones (high level)
1. Figma designs + figma-tree.md
2. Monorepo scaffold + env + DB migrations
3. API: auth, batches, contacts, exports, reports, admin
4. React: 8 pages responsive
5. Test cases page-wise
6. Preview + code review

## Verification (full task)
- Preview: `PUBLIC_PATH='/qa/email_harvesting' NODE_ENV=production npm run preview`
- Health: `/api/health`, all DB tables, DB-backed routes tested
