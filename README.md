# Email Harvesting & Contact Discovery Automation Platform

Build an automation platform that accepts CSV/XLS/XLSX files containing `store_url` values, normalizes domains, discovers business contacts through a strict multi-source fallback workflow, ranks contacts by role priority, and exports structured CSV/XLSX results.

Full product documentation: [`docs/README.md`](./docs/README.md)

## Required Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, webpack 5, Tailwind CSS, Formik + Yup |
| Backend API | Node.js, Express, Knex, MySQL 8+ |
| Queue/workers | In-process worker (Redis/BullMQ planned) |
| Browser automation | Playwright + Chromium (Phase 2) |
| Website crawler | Python service (Phase 2) |
| Storage | Local uploads + S3-compatible (env-configured) |

## Project Structure

| Path | Description |
|------|-------------|
| `apps/web` | React SPA — 8 pages, responsive |
| `apps/api` | REST API `/api/v1/*`, MySQL, file upload |
| `packages/config` | `@repo/config` env loading (Joi) |
| `docs/` | PRD, API, schema, Figma tree |
| `test/` | Page-wise functional test cases |
| `scripts/` | Preview proxy (`preview`, `preview:stop`) |

## Setup

```bash
cp .env.example .env
npm install
npm run db:init --workspace=api
```

**Default admin:** `admin@emailharvest.local` / `admin123`

## Development

```bash
npm run dev          # web :3001 + API watch
npm run build
```

## Preview

```bash
PUBLIC_PATH='/qa/email_harvesting' NODE_ENV=production npm run preview
npm run preview:stop
```

Health: `GET /api/health`  
Public: `https://imagent.identixweb.com/qa/email_harvesting/api/health`

## Agent TODO List (implementation status)

| # | Task | Status |
|---|------|--------|
| 1 | Read docs + create master plan | Done |
| 2 | Create Figma file + `docs/figma-tree.md` | Done (Figma pages pending MCP quota) |
| 3 | Scaffold Turborepo + env stack | Done |
| 4 | MySQL migrations + seed admin | Done |
| 5 | API: auth, batches, domains, contacts, exports, reports, admin | Done |
| 6 | Frontend: 8 responsive pages | Done |
| 7 | Register env vars in `.env` + `.env.example` | Done |
| 8 | Page-wise test cases in `test/` | Done |
| 9 | Preview verification + code review | Done |
| 10 | Playwright Snov/Apollo/LinkedIn workers | Phase 2 |
| 11 | Python website crawler service | Phase 2 |
| 12 | Redis + BullMQ queue | Phase 2 |
| 13 | S3 file storage integration | Phase 2 |
| 14 | Complete Figma frames (all breakpoints) | Pending MCP quota |

## Core Pages

1. Login — `/login`
2. Dashboard — `/dashboard`
3. Upload Batch — `/upload`
4. Batch Detail — `/batches/:batchId`
5. Domain Detail — `/domains/:domainId`
6. Contacts Results — `/contacts`
7. Reports — `/reports`
8. Settings — `/settings` (admin)

## Documentation Index

- [Product Requirements](./docs/product-requirements.md)
- [Frontend Requirements](./docs/frontend-requirements.md)
- [API Endpoints](./docs/api-endpoints.md)
- [Database Schema](./docs/database-schema.md)
- [Environment Variables](./docs/environment-variables.md)
- [Figma Tree](./docs/figma-tree.md)
