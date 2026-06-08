---
name: architecture
description: >
  Scaffold, configure, and architect monorepos using Turborepo (turbo). Use this skill
  whenever the user wants to: create a monorepo, set up a Turborepo workspace, add apps
  or packages to an existing Turbo repo, configure turbo.json pipelines/tasks, scaffold
  React frontends (Next.js App Router, webpack React SPA — JS or TS) or Node.js backends
  (Express, Fastify), share code between apps, set up caching and CI pipelines, or migrate
  an existing project into a monorepo. Trigger for any mention of "turborepo", "turbo
  monorepo", "monorepo setup", "shared packages", "workspace packages", "turbo.json",
  "npx create-turbo", "turbo run", "multi-package architecture", "react monorepo",
  "node monorepo", "express monorepo", "nextjs monorepo", "folder structure turbo",
  "webpack monorepo", "webpack react turbo", or "webpack typescript monorepo".
  Supports JavaScript (.js, .mjs, .cjs), TypeScript (.ts, .tsx, .d.ts), and other
  languages/extensions (Python, Go, Rust, config files, etc.) within the same repo.
---

# Turborepo Architecture Skill

Turborepo (`turbo`) is a high-performance build system for JavaScript/TypeScript monorepos. It caches task outputs and parallelizes work across packages to massively speed up builds and CI.

## Quick Decision Tree

Before writing any files, determine the scenario:

1. **New repo from scratch** → use `create-turbo` scaffold, then customize
2. **Add Turbo to existing repo** → install `turbo` as devDep, add `turbo.json`, update `package.json` scripts
3. **Add a React or Node app** → see [React + Node folder structures](./references/react-node-structure.md) for full layouts
4. **Add a new app/package to existing Turbo repo** → scaffold the package, wire workspace reference
5. **Configure tasks/caching** → edit `turbo.json`
6. **Run production preview (`pnpm preview`)** → Global Preview System in `react-node-structure.md`; script source in **Reference — preview scripts**
7. **Task complete gate** → when all work is done, run preview; **if not working**, diagnose logs + fix (DB/env if MySQL) and repeat until health passes — then `preview:stop` (`.cursor/rules/architecture.mdc` § 4.3 Steps 5–6, `pre-work-requirements.mdc` § 6)
8. **Multi-language repo** → see [multi-language reference](./references/multi-language.md)
9. **MySQL backend** → `DB_NAME={db_name}` in `{monorepo}/.env`; Docker `DB_HOST=db`; `db:init` if schema missing; corrupt migrations → reset `{db_name}` — [architecture.mdc](../rules/architecture.mdc) § 3.1–3.2, `database-common-stack.mdc`

Read the relevant reference file for the scenario — the [references index](./references/README.md) maps each scenario to its file. Always check which **package manager** the user is using — the workspace config differs between npm, pnpm, yarn, and bun.

**App paths:** resolve `{frontend_app}` and `{backend_app}` from `README.md` / workspaces — examples use `apps/web` and `apps/api` only as defaults (`planning.mdc`, `architecture.mdc` § 0).

**Before first implementation:** non-trivial work → `.cursor/rules/planning.mdc` → `plan/plan-[name].md`.

---

## React Framework Rule — When to Use Next.js vs Webpack

> **Rule:** Default to **webpack** (Variant D or E). Only use **Next.js** when the app explicitly needs SSR or SSG.

| Use Next.js (Variant A) | Use webpack (Variant D / E) |
|---|---|
| Landing page / marketing site needing SEO | Dashboard, admin panel, internal tool |
| Public-facing page where server-render matters | App behind login (no public crawlers) |
| Static site generation (`next export`) | SPA with client-only routing |
| Full-stack route handlers in same repo | API lives in a separate `apps/api` |
| User explicitly asks for Next.js | Everything else |

**In short:** if the user says "landing page", "marketing site", "SEO", or "server-side rendering" → Next.js. For anything else — dashboards, portals, admin panels, SPAs, apps behind auth — use webpack.

---

## Core Concepts

| Term | Meaning |
|---|---|
| **Workspace** | The entire monorepo root |
| **Package** | Any `apps/*` or `packages/*` sub-directory with its own `package.json` |
| **Task** | A script in `turbo.json` (build, dev, test, lint…) |
| **Pipeline** | The dependency graph between tasks across packages |
| **Cache** | Turbo stores task outputs; replays them if inputs haven't changed |

---

## Standard Directory Layout

```
my-monorepo/
├── apps/
│   ├── web/          ← React / Next.js frontend
│   ├── admin/        ← Another frontend
│   └── api/          ← Node / Express / Fastify backend
├── packages/
│   ├── ui/           ← Shared React components
│   ├── utils/        ← Shared utilities (JS or TS)
│   ├── types/        ← Shared TypeScript types
│   ├── config/       ← Shared tsconfig, eslint, etc.
│   └── [lang]/       ← Any language: Go, Python, Rust…
├── turbo.json        ← Task orchestration config
├── package.json      ← Root — workspaces declaration
└── .gitignore
```

> For **pnpm**, also add `pnpm-workspace.yaml` at root. For **Yarn Berry**, `.yarnrc.yml`.

### MySQL bootstrap (`db:init`)

When the API uses MySQL and **`DB_NAME` does not exist** yet, from the backend package root (e.g. `app/backend/`):

```bash
npm run db:init      # scripts/init-db.js → CREATE DATABASE + knex migrate:latest
npm run db:migrate   # migrations only (DB already exists)
```

Set `DB_NAME={db_name}` in `{monorepo}/.env` (unique per app; not `{platform_db_name}` for child QA). Docker: `DB_HOST=db` from container. See `architecture.mdc` § 3.1, `database-common-stack.mdc`, `env-variables.mdc`.

**Examples:** `{root folder name}` `login` → `{db_name}` `login_app`.

**Preview:** `db:migrate` before spawn; `db:init` if schema missing; corrupt migrations → reset `{db_name}` schema. § 3.2.

**MySQL:** after health — verify all tables (`db:status`, `SHOW TABLES`), then test every DB-backed route; fix schema or API issues, re-test — § 4.3 Step 3b, `database-common-stack.mdc`.

---

## Root `package.json`

### npm / yarn classic / bun
```json
{
  "name": "my-monorepo",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev":   "turbo run dev",
    "build": "turbo run build",
    "test":  "turbo run test",
    "lint":  "turbo run lint",
    "clean": "turbo run clean"
  },
  "devDependencies": {
    "turbo": "latest"
  },
  "packageManager": "npm@10.9.2"
}
```

### pnpm — also needs `pnpm-workspace.yaml`
```yaml
# pnpm-workspace.yaml
packages:
  - "apps/*"
  - "packages/*"
```
Root `package.json` uses `"packageManager": "pnpm@9.x.x"` and omits `"workspaces"`.

---

## `turbo.json` — Task Configuration

```jsonc
{
  "$schema": "https://turbo.build/schema.json",
  "ui": "tui",
  "tasks": {
    // build depends on upstream packages being built first
    "build": {
      "dependsOn": ["^build"],
      "inputs":  ["src/**", "package.json", "tsconfig.json"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"]
    },
    // dev runs in parallel (no ^dependsOn needed for watch mode)
    "dev": {
      "cache": false,
      "persistent": true
    },
    // test depends on build
    "test": {
      "dependsOn": ["build"],
      "inputs":  ["src/**", "tests/**"],
      "outputs": ["coverage/**"]
    },
    // lint is independent — runs in parallel
    "lint": {
      "inputs": ["src/**", ".eslintrc*", "eslint.config.*"]
    },
    // type-check
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "clean": {
      "cache": false
    }
  }
}
```

**`^` prefix** means "run the same task in all dependency packages first." Remove it for tasks that should run in isolation.

---

## Per-Language Package Templates

See reference files for copy-paste templates:

- **[React + Node.js folder structures](./references/react-node-structure.md)** — Full production folder layouts for Next.js (App Router), webpack React SPA (JS + TS), Express, Fastify, Node + webpack (JS + TS), Redux (`redux/store` + `redux/slice/`), shared `ui` and `utils` packages, webpack configs, **CSS Modules + css-loader v7** (`namedExport: false`, `*.module.css`), global preview system — **Reference — preview scripts** (`pnpm preview` / `pnpm preview:stop`), single-port reverse proxy, root `.env` with `PORT`/`PUBLIC_PATH`, and browser API base = `PUBLIC_PATH` via `DefinePlugin`. **Read this first when scaffolding any React or Node app.**
- **[TypeScript app/package](./references/typescript.md)** — `.ts`, `.tsx`, `tsconfig`, `tsup` build
- **[JavaScript app/package](./references/javascript.md)** — `.js`, `.mjs`, `.cjs`, no transpile step
- **[Multi-language](./references/multi-language.md)** — Python, Go, Rust, shell scripts in the same Turbo repo

---

## Shared TypeScript Config Pattern

```
packages/config/
├── package.json
├── tsconfig.base.json     ← Root TS config
├── tsconfig.react.json    ← Extends base, adds JSX
└── tsconfig.node.json     ← Extends base, targets Node
```

`packages/config/tsconfig.base.json`:
```json
{
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

Each package's `tsconfig.json`:
```json
{
  "extends": "@repo/config/tsconfig.base.json",
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

---

## Referencing Internal Packages

In any app's `package.json`, depend on a local package using `"*"` (npm/yarn) or `"workspace:*"` (pnpm):

```json
{
  "dependencies": {
    "@repo/ui":    "*",
    "@repo/utils": "workspace:*"
  }
}
```

The internal package must export correctly (see TypeScript reference for dual CJS/ESM setup).

---

## `.gitignore` additions

```
# Turborepo
.turbo
node_modules
dist
.next
build
coverage
```

---

## Common `turbo run` Commands

```bash
turbo run build              # Build all packages
turbo run build --filter=web # Build only "web" and its deps
turbo run dev --parallel     # Run all dev servers
turbo run test --affected    # Only test what changed
turbo run build --dry=json   # Preview what would run
turbo run build --force      # Bypass cache
```

---

## Remote Caching (CI Speed)

```bash
npx turbo login              # Authenticate with Vercel (free)
npx turbo link               # Link repo to remote cache
```

Add to CI (GitHub Actions example):
```yaml
- name: Build
  run: npx turbo run build
  env:
    TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
    TURBO_TEAM:  ${{ vars.TURBO_TEAM }}
```

---

## Step-by-Step: Scaffold from Scratch

```bash
# 1. Create repo
npx create-turbo@latest my-monorepo
cd my-monorepo

# 2. Install deps
npm install   # or pnpm install / yarn

# 3. Run dev
npm run dev

# 4. Add a new package
mkdir -p packages/my-lib && cd packages/my-lib
npm init -y
# ... add src/index.ts, tsconfig, build script
```

---

## Step-by-Step: Add Turbo to Existing Repo

```bash
# 1. Install turbo
npm install --save-dev turbo

# 2. Add workspaces to root package.json (if not already)
# "workspaces": ["apps/*", "packages/*"]

# 3. Create turbo.json at root
# (use template above)

# 4. Replace existing scripts
# "build": "turbo run build"

# 5. Add .turbo to .gitignore
```

---

## Package Configurations (Per-Package `turbo.json`)

A package can have its own `turbo.json` to override root config:

```jsonc
// packages/ui/turbo.json
{
  "extends": ["//"],
  "tasks": {
    "build": {
      "outputs": ["dist/**", "storybook-static/**"]
    }
  }
}
```

---

## Common Pitfalls

| Problem | Fix |
|---|---|
| Import errors across packages | Check `exports` field in shared package's `package.json`; ensure `build` ran |
| TS path resolution broken | Verify `tsconfig.json` `paths` and that `packages/config` is built |
| Workspace package not found | Run install from repo root, not inside a package |
| Dev server not hot-reloading shared package | Use source maps + `"exports"` pointing to `src/` in dev, `dist/` in prod |
| Cache stale after config change | Add the config file to `inputs` in `turbo.json`, or run `--force` once |
| `PUBLIC_PATH` ignored on `npm run preview` | Add `PUBLIC_PATH` (and related vars) to `build.env` in `turbo.json`; run `build -- --force` after path change. See `.cursor/rules/turbo-env-cache.mdc` |
| `404 Cannot POST /qa/{root folder name}/v1/...` on preview/deploy | Browser URL missing `/api`: use `apiFetch("/api/v1/...")` with `__API_BASE_URL__` = `PUBLIC_PATH` in prod — not `API_BASE_URL`. See `architecture.mdc` § 4.2.1 |
| API works on `API_PORT` but fails via proxy/nginx | Curl `{PUBLIC_PATH}/api/health`, not `{PUBLIC_PATH}/v1/...` — `proxy.js` only forwards `…/api/*` |
| Task marked done without preview | Run `PUBLIC_PATH='/qa/{root folder name}' NODE_ENV=production npm run preview`; curl local + `https://imagent.identixweb.com/qa/{root folder name}/api/health` |
| Public URL 404 but local preview OK | Preview not running, wrong `PORT`, or `PUBLIC_PATH` ≠ `/qa/{root folder name}` (basename of repo root) |
| Windows path issues | Use WSL 2 or ensure Node ≥ 18 |
