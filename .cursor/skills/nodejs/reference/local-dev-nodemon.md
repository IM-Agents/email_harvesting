# Local development with nodemon

Use **nodemon** as the default tool to run a Node.js HTTP API (or worker) on your machine. It watches files and restarts the process when code changes, so you do not manually stop and start `node` after every edit.

## When to use nodemon

| Context | Command |
|---------|---------|
| Local development | `npm run dev` → nodemon |
| Production / staging | `npm start` → plain `node` (or container/orchestrator) |
| CI tests | `node` or test runner (`vitest`, `jest`) — not nodemon |

Nodemon is **not** a process manager for production. It does not cluster, load-balance, or restart crashed processes in the way PM2 or Kubernetes does.

## Installation

```bash
npm install --save-dev nodemon
```

Keep it in `devDependencies` only.

## package.json scripts

```json
{
  "scripts": {
    "dev": "nodemon",
    "start": "node src/server.js",
    "build": "tsc -p tsconfig.json"
  }
}
```

Document in the project README that **`npm run dev`** is how developers start the local server.

## nodemon.json (project root)

Prefer a dedicated config file so CLI flags stay out of scripts:

```json
{
  "watch": ["src", "config"],
  "ext": "js,mjs,cjs,json",
  "ignore": [
    "node_modules",
    "dist",
    "coverage",
    "logs",
    "**/*.test.js",
    "**/*.spec.ts"
  ],
  "exec": "node src/server.js",
  "env": {
    "NODE_ENV": "development"
  },
  "delay": "500"
}
```

- **watch:** directories that should trigger a restart.
- **ext:** file extensions to monitor (add `ts` when running TypeScript directly).
- **ignore:** tests, build output, and noisy paths to avoid restart loops.
- **exec:** command nodemon runs (your app entry).
- **delay:** optional debounce (ms) when many files save at once (e.g. format-on-save).

## TypeScript projects

Pick **one** local workflow and document it:

### Option A — run TS directly (tsx / ts-node)

```json
{
  "scripts": {
    "dev": "nodemon --exec \"node --import tsx\" src/server.ts"
  }
}
```

```json
{
  "watch": ["src"],
  "ext": "ts,json",
  "exec": "node --import tsx src/server.ts"
}
```

### Option B — compile then run JS

Terminal 1: `tsc -w`  
Terminal 2: nodemon watches `dist/`:

```json
{
  "watch": ["dist"],
  "ext": "js",
  "exec": "node dist/server.js"
}
```

Or use a single script with `concurrently` if the team prefers one command.

## Express / Fastify entry

The file nodemon executes should:

1. Load and validate config (including `.env` in development).
2. Create the HTTP server and call `listen` on `PORT` (default e.g. `3000`).
3. Register **graceful shutdown** on `SIGTERM` / `SIGINT` so restarts close DB pools and in-flight requests cleanly.

```javascript
// src/server.js
import { createApp } from './app.js';

const port = Number(process.env.PORT) || 3000;
const server = createApp().listen(port, () => {
  console.info({ port }, 'listening');
});

const shutdown = async (signal) => {
  console.info({ signal }, 'shutdown');
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
```

Without shutdown handlers, nodemon restarts can leave orphaned DB connections during active development.

## Environment variables

- Use `.env` / `.env.local` for local-only values; load them in your config module, not scattered in route files.
- Set `NODE_ENV=development` in nodemon config or `.env`.
- Never commit secrets; provide `.env.example` with dummy keys.

## Common pitfalls

| Problem | Fix |
|---------|-----|
| Restart loop on every save | Add `dist`, `coverage`, logs to `ignore`; use `delay` |
| Changes in `packages/` not picked up | Add monorepo paths to `watch` |
| Port already in use after crash | Ensure shutdown closes server; kill stray process or use `kill-port` in docs |
| Expecting HMR like frontend bundlers | Nodemon **restarts the whole process**; in-memory state resets |
| Using nodemon in Docker prod image | Use `node` in `CMD`; nodemon only in dev compose if needed |

## Docker Compose (optional dev profile)

```yaml
services:
  api:
    build: .
    command: npm run dev
    volumes:
      - .:/app
      - /app/node_modules
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: development
```

Mount source for live edits; keep nodemon inside the dev profile, not the production image.

## Checklist for new services

- [ ] `nodemon` in `devDependencies`
- [ ] `npm run dev` script documented in README
- [ ] `nodemon.json` or inline config with sensible `watch` / `ignore`
- [ ] Entry file matches production entry path where possible
- [ ] Graceful shutdown on SIGTERM/SIGINT
- [ ] `.env.example` for required local variables
