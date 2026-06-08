# React & Node.js Full Folder Structures

Complete, production-ready folder layouts for React frontends and Node.js backends
inside a Turborepo monorepo. Use these as scaffolding blueprints — generate the exact
files shown for the user's chosen variant.

---

## Dependency versions

- **MUST** install **latest stable** releases when scaffolding (`npm install <package>@latest`).
- Example `package.json` blocks use `"latest"` as a placeholder—not pinned semver ranges.
- After bootstrap, lock versions in `package-lock.json` (or your package manager lockfile) and refresh with `npm outdated` / Renovate as needed.
- Check upstream release notes when upgrading (breaking changes, new defaults—e.g. css-loader `namedExport` behavior).

---

## React App Variants

> ⚠️ **Rule: default to webpack. Use Next.js only when the app is a landing page or needs SEO / SSR.**
>
> | Use Next.js | Use webpack |
> |---|---|
> | Landing page, marketing site, SEO-critical | Dashboard, admin panel, internal tool |
> | Public page needing server-side rendering | App behind login / no public crawlers |
> | Static site generation (`next export`) | SPA with client-only routing |
> | Full-stack with API route handlers in same app | API lives separately in `apps/api` |
> | User explicitly requests Next.js | Everything else |

| Variant | Framework | Build Tool | Best For |
|---|---|---|---|
| A | Next.js (latest stable, App Router) | next build | Landing pages, SSR, SEO |
| D | React SPA — webpack `.js`/`.jsx` | webpack (latest) + babel-loader | SPAs, dashboards, apps behind auth |
| E | React SPA — webpack `.ts`/`.tsx` | webpack (latest) + ts-loader | TypeScript SPAs, dashboards |

---

## Variant A — Next.js App Router (TypeScript)

```
apps/web/
├── public/
│   ├── favicon.ico
│   └── images/
│       └── logo.svg
├── src/
│   ├── app/                        ← App Router root
│   │   ├── layout.tsx              ← Root layout (html, body)
│   │   ├── page.tsx                ← Home route  /
│   │   ├── globals.css
│   │   ├── (marketing)/            ← Route group — no URL segment
│   │   │   ├── about/
│   │   │   │   └── page.tsx        ← /about
│   │   │   └── pricing/
│   │   │       └── page.tsx        ← /pricing
│   │   ├── dashboard/
│   │   │   ├── layout.tsx          ← Dashboard shell layout
│   │   │   ├── page.tsx            ← /dashboard
│   │   │   └── settings/
│   │   │       └── page.tsx        ← /dashboard/settings
│   │   └── api/                    ← Route handlers
│   │       └── health/
│   │           └── route.ts        ← GET /api/health
│   ├── components/
│   │   ├── ui/                     ← Low-level UI (use @repo/ui instead if shared)
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   └── index.ts
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── index.ts
│   │   └── features/               ← Feature-scoped components
│   │       ├── auth/
│   │       │   ├── LoginForm.tsx
│   │       │   └── SignupForm.tsx
│   │       └── dashboard/
│   │           └── StatsCard.tsx
│   ├── lib/                        ← Pure utilities & helpers
│   │   ├── utils.ts
│   │   ├── constants.ts
│   │   └── validations.ts
│   ├── hooks/                      ← Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useLocalStorage.ts
│   │   └── index.ts
│   ├── redux/                      ← Redux
│   │   ├── store.ts                ← configureStore + RootState / AppDispatch
│   │   ├── hooks.ts                ← typed useAppDispatch / useAppSelector
│   │   └── slice/                 ← one file per feature slice
│   │       ├── authSlice.ts        ← setCredentials, logout
│   │       ├── uiSlice.ts          ← toggleSidebar, setTheme
│   │       └── userSlice.ts        ← fetchUsers (createAsyncThunk)
│   ├── services/                   ← API call functions
│   │   ├── api.ts                  ← Base fetch/axios wrapper
│   │   ├── auth.service.ts
│   │   └── users.service.ts
│   └── types/                      ← App-local types (use @repo/types for shared)
│       ├── auth.types.ts
│       └── index.ts
├── .env.local                      ← Local env vars (gitignored)
├── .env.example                    ← Committed env template
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.js
├── tsconfig.json
└── package.json
```

### `apps/web/package.json`
```json
{
  "name": "web",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev":       "next dev --turbopack --port 3000",
    "build":     "next build",
    "start":     "next start",
    "lint":      "next lint",
    "typecheck": "tsc --noEmit",
    "clean":     "rm -rf .next out"
  },
  "dependencies": {
    "@repo/ui":    "*",
    "@repo/utils": "*",
    "@repo/types": "*",
    "next": "latest",
    "react": "latest",
    "react-dom": "latest"
  },
  "devDependencies": {
    "@repo/config":          "*",
    "@types/react": "latest",
    "@types/react-dom": "latest",
    "@types/node": "latest",
    "autoprefixer": "latest",
    "postcss": "latest",
    "tailwindcss": "latest",
    "typescript": "latest"
  }
}
```

### `apps/web/src/app/layout.tsx`
```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "My App",
  description: "Built with Turborepo",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
```

### `apps/web/src/app/page.tsx`
```tsx
export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">Hello from web</h1>
    </main>
  );
}
```

---

## Node.js API Variants

| Variant | Framework | Best For |
|---|---|---|
| X | Express + TypeScript | REST APIs, quick services |
| Y | Fastify + TypeScript | High-perf APIs, plugins |
| Z | Express + JS (no build) | Simple scripts, lightweight |

---

## Variant X — Express REST API (TypeScript)

```
apps/api/
├── src/
│   ├── index.ts                    ← Entry — creates app & starts server
│   ├── app.ts                      ← Express app setup (no listen)
│   ├── config/
│   │   ├── env.ts                  ← Validated env vars (zod / dotenv)
│   │   └── database.ts             ← DB connection (Prisma / Mongoose / pg)
│   ├── routes/
│   │   ├── index.ts                ← Mounts all routers
│   │   ├── auth.routes.ts          ← /api/auth/*
│   │   ├── users.routes.ts         ← /api/users/*
│   │   └── health.routes.ts        ← /api/health
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   └── users.controller.ts
│   ├── services/
│   │   ├── auth.service.ts         ← Business logic
│   │   └── users.service.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts      ← JWT / session guard
│   │   ├── error.middleware.ts     ← Global error handler
│   │   ├── validate.middleware.ts  ← Request body validation
│   │   └── logger.middleware.ts
│   ├── models/                     ← DB models / Prisma schema lives at root
│   │   └── user.model.ts
│   ├── lib/
│   │   ├── logger.ts               ← Pino / Winston setup
│   │   ├── jwt.ts
│   │   └── hash.ts
│   └── types/
│       ├── express.d.ts            ← Augment Express Request type
│       └── index.ts
├── tests/
│   ├── integration/
│   │   └── auth.test.ts
│   └── unit/
│       └── users.service.test.ts
├── prisma/                         ← If using Prisma
│   └── schema.prisma
├── .env
├── .env.example
├── tsconfig.json
└── package.json
```

### `apps/api/package.json`
```json
{
  "name": "api",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev":       "tsx watch src/index.ts",
    "build":     "tsc -p tsconfig.json",
    "start":     "node dist/index.js",
    "test":      "vitest run",
    "lint":      "eslint src/",
    "typecheck": "tsc --noEmit",
    "db:migrate": "prisma migrate dev",
    "db:generate": "prisma generate",
    "clean":     "rm -rf dist"
  },
  "dependencies": {
    "@repo/types":   "*",
    "@repo/utils":   "*",
    "express": "latest",
    "cors": "latest",
    "helmet": "latest",
    "zod": "latest",
    "pino": "latest",
    "jsonwebtoken": "latest",
    "bcryptjs": "latest"
  },
  "devDependencies": {
    "@repo/config":       "*",
    "@types/express": "latest",
    "@types/cors": "latest",
    "@types/node": "latest",
    "@types/jsonwebtoken": "latest",
    "@types/bcryptjs": "latest",
    "tsx": "latest",
    "typescript": "latest",
    "vitest": "latest"
  }
}
```

### `apps/api/src/index.ts`
```ts
import { app } from "./app";
import { env } from "./config/env";
import { logger } from "./lib/logger";

const server = app.listen(env.PORT, () => {
  logger.info(`API running on http://localhost:${env.PORT}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully");
  server.close(() => process.exit(0));
});
```

### `apps/api/src/app.ts`
```ts
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { errorMiddleware } from "./middleware/error.middleware";
import { loggerMiddleware } from "./middleware/logger.middleware";
import { router } from "./routes";

export const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN ?? "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(loggerMiddleware);

app.use("/api", router);

app.use(errorMiddleware);
```

### `apps/api/src/routes/index.ts`
```ts
import { Router } from "express";
import { healthRouter } from "./health.routes";
import { authRouter }   from "./auth.routes";
import { usersRouter }  from "./users.routes";

export const router = Router();

router.use("/health", healthRouter);
router.use("/auth",   authRouter);
router.use("/users",  usersRouter);
```

### `apps/api/src/routes/health.routes.ts`
```ts
import { Router } from "express";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});
```

### `apps/api/src/config/env.ts`
```ts
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV:    z.enum(["development", "test", "production"]).default("development"),
  PORT:        z.coerce.number().default(4000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET:  z.string().min(32),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
});

export const env = envSchema.parse(process.env);
```

### `apps/api/src/middleware/error.middleware.ts`
```ts
import type { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger";

export function errorMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  logger.error(err);
  res.status(500).json({ error: err.message ?? "Internal Server Error" });
}
```

---

## Variant Y — Fastify API (TypeScript)

```
apps/api/
├── src/
│   ├── index.ts                    ← Entry
│   ├── server.ts                   ← Fastify instance + plugin registration
│   ├── config/
│   │   └── env.ts
│   ├── plugins/
│   │   ├── cors.ts                 ← @fastify/cors
│   │   ├── jwt.ts                  ← @fastify/jwt
│   │   └── sensible.ts             ← @fastify/sensible
│   ├── routes/
│   │   ├── health/
│   │   │   └── index.ts
│   │   ├── auth/
│   │   │   └── index.ts
│   │   └── users/
│   │       └── index.ts
│   ├── schemas/                    ← JSON Schema / Zod for request validation
│   │   └── user.schema.ts
│   ├── services/
│   │   └── users.service.ts
│   ├── hooks/                      ← Fastify lifecycle hooks
│   │   └── auth.hook.ts
│   └── types/
│       └── fastify.d.ts            ← Augment FastifyRequest
├── tests/
├── tsconfig.json
└── package.json
```

### `apps/api/package.json` (Fastify)
```json
{
  "name": "api",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev":   "tsx watch src/index.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/index.js",
    "test":  "vitest run",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "@repo/types":       "*",
    "fastify": "latest",
    "@fastify/cors": "latest",
    "@fastify/jwt": "latest",
    "@fastify/sensible": "latest",
    "zod": "latest"
  },
  "devDependencies": {
    "@repo/config": "*",
    "@types/node": "latest",
    "tsx": "latest",
    "typescript": "latest",
    "vitest": "latest"
  }
}
```

---

## Variant Z — Express + Plain JS (No Build)

```
apps/api/
├── src/
│   ├── index.js                    ← Entry
│   ├── app.js                      ← Express setup
│   ├── config/
│   │   └── env.js
│   ├── routes/
│   │   ├── index.js
│   │   ├── auth.routes.js
│   │   └── health.routes.js
│   ├── controllers/
│   │   └── auth.controller.js
│   ├── services/
│   │   └── auth.service.js
│   ├── middleware/
│   │   └── error.middleware.js
│   └── lib/
│       └── logger.js
├── tests/
├── .env
├── .env.example
└── package.json
```

### `apps/api/package.json` (plain JS)
```json
{
  "name": "api",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "dev":   "node --watch src/index.js",
    "start": "node src/index.js",
    "build": "echo no build step",
    "test":  "node --experimental-vm-modules node_modules/.bin/jest",
    "lint":  "eslint src/",
    "clean": "echo ok"
  },
  "dependencies": {
    "@repo/utils": "*",
    "express": "latest",
    "cors": "latest",
    "helmet": "latest"
  },
  "devDependencies": {
    "eslint": "latest"
  }
}
```

---

## Shared UI Package (`packages/ui`)

Used by both React apps. Full folder structure:

```
packages/ui/
├── src/
│   ├── index.ts                    ← Re-exports everything
│   ├── components/
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.test.tsx
│   │   │   └── index.ts
│   │   ├── Input/
│   │   │   ├── Input.tsx
│   │   │   └── index.ts
│   │   ├── Card/
│   │   │   ├── Card.tsx
│   │   │   └── index.ts
│   │   ├── Modal/
│   │   │   ├── Modal.tsx
│   │   │   └── index.ts
│   │   └── Badge/
│   │       ├── Badge.tsx
│   │       └── index.ts
│   ├── hooks/
│   │   ├── useClickOutside.ts
│   │   └── useMediaQuery.ts
│   └── styles/
│       ├── tokens.css              ← CSS custom properties
│       └── reset.css
├── storybook/                      ← Optional Storybook
│   └── stories/
│       └── Button.stories.tsx
├── package.json
├── tsconfig.json
├── tsup.config.ts
└── turbo.json
```

---

## Shared Utils Package (`packages/utils`)

```
packages/utils/
├── src/
│   ├── index.ts                    ← Barrel export
│   ├── string.ts                   ← capitalize, slugify, truncate…
│   ├── date.ts                     ← formatDate, timeAgo, isExpired…
│   ├── array.ts                    ← chunk, unique, groupBy…
│   ├── object.ts                   ← omit, pick, deepMerge…
│   ├── validation.ts               ← isEmail, isUrl, isUUID…
│   └── http.ts                     ← createFetcher, buildUrl…
├── tests/
│   └── string.test.ts
├── package.json
├── tsconfig.json
└── tsup.config.ts
```

---

## `.env.example` Template

Every app should commit an `.env.example`. Never commit `.env`.

### `apps/api/.env.example`
```bash
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://user:password@localhost:5432/mydb
JWT_SECRET=change-me-to-at-least-32-random-chars
CORS_ORIGIN=http://localhost:3000
```

### `apps/web/.env.example`
```bash
NEXT_PUBLIC_API_URL=http://localhost:4000
```

---

## Full Combined Tree (React + Node in one Turbo repo)

```
my-monorepo/
├── apps/
│   ├── web/                        ← React app (Next.js or webpack SPA)
│   │   ├── src/
│   │   │   ├── app/  (Next.js)     OR  pages/ (webpack SPA)
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   ├── redux/              ← store.ts + slice/
│   │   │   │   ├── store.ts
│   │   │   │   ├── hooks.ts
│   │   │   │   └── slice/
│   │   │   │       └── [feature]Slice.ts
│   │   │   └── types/
│   │   ├── public/
│   │   ├── .env.local
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── api/                        ← Node.js API (Express or Fastify)
│       ├── src/
│       │   ├── index.ts
│       │   ├── app.ts
│       │   ├── config/
│       │   ├── routes/
│       │   ├── controllers/
│       │   ├── services/
│       │   ├── middleware/
│       │   ├── lib/
│       │   └── types/
│       ├── tests/
│       ├── .env
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   ├── ui/                         ← Shared React components
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsup.config.ts
│   │
│   ├── utils/                      ← Shared JS/TS utilities
│   │   ├── src/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsup.config.ts
│   │
│   ├── types/                      ← Shared TypeScript types
│   │   ├── src/
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── config/                     ← Shared tsconfig, eslint
│       ├── tsconfig.base.json
│       ├── tsconfig.react.json
│       ├── tsconfig.node.json
│       └── package.json
│
├── turbo.json
├── package.json
├── .gitignore
└── README.md
```

---

## Webpack Setup — React & Node (JS and TS)

| App | Language | Config file | Transpiler |
|---|---|---|---|
| React SPA | `.js` / `.jsx` | `webpack.config.js` | `babel-loader` |
| React SPA | `.ts` / `.tsx` | `webpack.config.ts` | `ts-loader` |
| Node API  | `.js` / `.cjs` | `webpack.config.js` | `babel-loader` |
| Node API  | `.ts`          | `webpack.config.ts` | `ts-loader`  |

> For React SPAs, webpack is the build tool — the `src/` folder structure matches the layout used in Variant D/E. For Node, webpack bundles into a single `dist/server.js`, useful for Docker or Lambda.

### CSS Modules + css-loader (latest — required)

When using the **latest css-loader** with `*.module.css` and `import styles from "./X.module.css"`:

- **MUST** set `modules.namedExport: false` on the css-loader rule. Current css-loader defaults `esModule: true` and often `namedExport: true`, so the **default export can be the CSS injection payload**, not the class-name map. Without `namedExport: false`, runtime errors occur at module init (e.g. `Cannot read properties of undefined (reading 'function')` when a class is named `.function`). Confirm defaults in the version you install.
- **MUST** use `*.module.css` for component-scoped styles; keep global resets in `index.css` (no `.module` suffix).
- **MUST** use default import for locals: `import styles from "./Button.module.css"` → `className={styles.primary}`.
- Reserved CSS class names (`.function`, `.default`) are valid; access as `styles.function`, `styles.default` when `namedExport: false`.

**Option A — separate rules** (plain CSS + CSS Modules): see Variant D/E `webpack.config` below; add `namedExport: false` only on the `.module.css` rule.

**Option B — single rule with `auto`** (simpler monorepos):

```js
{
  test: /\.css$/,
  use: [
    isDev ? "style-loader" : MiniCssExtractPlugin.loader,
    {
      loader: "css-loader",
      options: {
        modules: {
          auto: /\.module\.css$/i,
          localIdentName: "[local]___[hash:base64:5]",
          namedExport: false,
        },
      },
    },
  ],
},
```

If you intentionally use `namedExport: true`, import locals with `import * as styles from "./X.module.css"` or named imports — **do not** mix default `import styles` in the same app.

Install latest `css-loader` in `apps/web/package.json` (`npm install css-loader@latest -D`) and verify `namedExport` behavior in that release's docs.

---

## Variant D — React + Webpack (JavaScript `.js` / `.jsx`)

```
apps/web/
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── pages/
│   ├── components/
│   ├── hooks/
│   ├── services/
│   ├── redux/                      ← Redux
│   │   ├── store.js                ← configureStore root
│   │   ├── hooks.js                ← useAppDispatch / useAppSelector
│   │   └── slice/                 ← one file per feature
│   │       ├── authSlice.js
│   │       ├── uiSlice.js
│   │       └── userSlice.js
│   ├── lib/
│   └── types/
├── public/
│   ├── index.html
│   └── favicon.ico
├── webpack.config.js
├── babel.config.js
├── .browserslistrc
└── package.json
```

### `apps/web/package.json`
```json
{
  "name": "web",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev":   "webpack serve --mode development",
    "build": "webpack --mode production",
    "lint":  "eslint src/",
    "test":  "jest",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "@repo/ui":              "*",
    "@repo/utils":           "*",
    "react": "latest",
    "react-dom": "latest",
    "react-router-dom": "latest",
    "@reduxjs/toolkit": "latest",
    "react-redux": "latest"
  },
  "devDependencies": {
    "@babel/core": "latest",
    "@babel/preset-env": "latest",
    "@babel/preset-react": "latest",
    "babel-loader": "latest",
    "css-loader": "latest",
    "style-loader": "latest",
    "html-webpack-plugin": "latest",
    "mini-css-extract-plugin": "latest",
    "copy-webpack-plugin": "latest",
    "webpack": "latest",
    "webpack-cli": "latest",
    "webpack-dev-server": "latest"
  }
}
```

### `apps/web/src/redux/store.js`
```js
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slice/authSlice";
import uiReducer   from "./slice/uiSlice";
import userReducer  from "./slice/userSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui:   uiReducer,
    user: userReducer,
  },
});
```

### `apps/web/src/redux/hooks.js`
```js
import { useDispatch, useSelector } from "react-redux";

/** @returns {import("@reduxjs/toolkit").Dispatch} */
export const useAppDispatch = () => useDispatch();

/**
 * @template T
 * @param {(state: ReturnType<typeof import("./store").store.getState>) => T} selector
 */
export const useAppSelector = (selector) => useSelector(selector);
```

### `apps/web/src/redux/slice/authSlice.js`
```js
import { createSlice } from "@reduxjs/toolkit";

/** @type {{ user: object|null, token: string|null, loading: boolean }} */
const initialState = {
  user:    null,
  token:   null,
  loading: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(state, action) {
      state.user  = action.payload.user;
      state.token = action.payload.token;
    },
    logout(state) {
      state.user  = null;
      state.token = null;
    },
    setLoading(state, action) {
      state.loading = action.payload;
    },
  },
});

export const { setCredentials, logout, setLoading } = authSlice.actions;
export default authSlice.reducer;
```

### `apps/web/src/redux/slice/uiSlice.js`
```js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  sidebarOpen: false,
  theme:       "light",   // "light" | "dark"
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setTheme(state, action) {
      state.theme = action.payload;
    },
  },
});

export const { toggleSidebar, setTheme } = uiSlice.actions;
export default uiSlice.reducer;
```

### `apps/web/src/redux/slice/userSlice.js`
```js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

export const fetchUsers = createAsyncThunk("user/fetchAll", async (_, { rejectWithValue }) => {
  try {
    const res = await fetch("/api/users");
    if (!res.ok) throw new Error("Failed to fetch users");
    return res.json();
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

const userSlice = createSlice({
  name: "user",
  initialState: { list: [], status: "idle", error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending,   (state)          => { state.status = "loading"; })
      .addCase(fetchUsers.fulfilled, (state, action)  => { state.status = "succeeded"; state.list = action.payload; })
      .addCase(fetchUsers.rejected,  (state, action)  => { state.status = "failed";    state.error = action.payload; });
  },
});

export default userSlice.reducer;
```

### Wire store in `apps/web/src/main.jsx`
```jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./redux/store";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
```

---
```

### `apps/web/babel.config.js`
```js
module.exports = {
  presets: [
    ["@babel/preset-env", { targets: "> 0.25%, not dead" }],
    ["@babel/preset-react", { runtime: "automatic" }],
  ],
};
```

### `apps/web/webpack.config.js`
```js
const path                 = require("path");
const HtmlWebpackPlugin    = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyWebpackPlugin    = require("copy-webpack-plugin");

const isDev = process.env.NODE_ENV !== "production";

/** @type {import('webpack').Configuration} */
module.exports = {
  mode:   isDev ? "development" : "production",
  target: "web",

  entry: "./src/main.jsx",

  output: {
    path:       require("path").resolve(__dirname, "dist"),
    filename:   isDev ? "js/[name].js" : "js/[name].[contenthash:8].js",
    publicPath: "/",
    clean:      true,
  },

  resolve: {
    extensions: [".js", ".jsx", ".json"],
    alias: {
      "@":           path.resolve(__dirname, "src"),
      "@repo/ui":    path.resolve(__dirname, "../../packages/ui/src"),
      "@repo/utils": path.resolve(__dirname, "../../packages/utils/src"),
    },
  },

  module: {
    rules: [
      // JS / JSX
      {
        test:    /\.[jt]sx?$/,
        exclude: /node_modules/,
        use:     "babel-loader",
      },
      // Plain CSS
      {
        test:    /\.css$/,
        exclude: /\.module\.css$/,
        use: [isDev ? "style-loader" : MiniCssExtractPlugin.loader, "css-loader"],
      },
      // CSS Modules (latest css-loader: namedExport false for `import styles from "*.module.css"`)
      {
        test: /\.module\.css$/,
        use: [
          isDev ? "style-loader" : MiniCssExtractPlugin.loader,
          {
            loader:  "css-loader",
            options: {
              modules: {
                localIdentName: "[name]__[local]--[hash:base64:5]",
                namedExport:    false,
              },
            },
          },
        ],
      },
      // Images & fonts
      {
        test: /\.(png|jpe?g|gif|svg|woff2?|eot|ttf|otf)$/,
        type: "asset/resource",
        generator: { filename: "assets/[name].[hash:8][ext]" },
      },
    ],
  },

  plugins: [
    new HtmlWebpackPlugin({ template: "./public/index.html", favicon: "./public/favicon.ico" }),
    !isDev && new MiniCssExtractPlugin({ filename: "css/[name].[contenthash:8].css" }),
    new CopyWebpackPlugin({
      patterns: [{ from: "public", to: ".", globOptions: { ignore: ["**/index.html"] } }],
    }),
  ].filter(Boolean),

  devServer: {
    port:               3000,
    hot:                true,
    historyApiFallback: true,
    proxy: [{ context: ["/api"], target: "http://localhost:4000" }],
    static: { directory: path.join(__dirname, "public") },
  },

  optimization: {
    splitChunks: {
      chunks: "all",
      cacheGroups: {
        vendor: { test: /[\\/]node_modules[\\/]/, name: "vendors", chunks: "all" },
      },
    },
  },

  devtool: isDev ? "eval-source-map" : "source-map",
};
```

### `apps/web/public/index.html`
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>My App</title>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
```

---

## Variant E — React + Webpack (TypeScript `.ts` / `.tsx`)

```
apps/web/
├── src/
│   ├── main.tsx                ← entry — wraps <Provider store={store}>
│   ├── App.tsx
│   ├── pages/
│   ├── components/
│   ├── hooks/
│   ├── services/
│   ├── redux/                  ← Redux
│   │   ├── store.ts            ← configureStore + RootState / AppDispatch
│   │   ├── hooks.ts            ← typed useAppDispatch / useAppSelector
│   │   └── slice/             ← one file per feature slice
│   │       ├── authSlice.ts
│   │       ├── uiSlice.ts
│   │       └── userSlice.ts
│   ├── lib/
│   └── types/
├── public/
│   └── index.html
├── webpack.config.ts           ← typed config (parsed by ts-node)
├── tsconfig.json               ← app TS config
├── tsconfig.webpack.json       ← separate CJS tsconfig for webpack config file
└── package.json
```

### `apps/web/package.json`
```json
{
  "name": "web",
  "version": "0.0.1",
  "private": true,
  "ts-node": { "project": "tsconfig.webpack.json" },
  "scripts": {
    "dev":       "webpack serve --mode development",
    "build":     "webpack --mode production",
    "typecheck": "tsc --noEmit",
    "lint":      "eslint src/",
    "test":      "jest",
    "clean":     "rm -rf dist"
  },
  "dependencies": {
    "@repo/ui":           "*",
    "@repo/utils":        "*",
    "@repo/types":        "*",
    "react": "latest",
    "react-dom": "latest",
    "react-router-dom": "latest",
    "@reduxjs/toolkit": "latest",
    "react-redux": "latest"
  },
  "devDependencies": {
    "@repo/config":              "*",
    "@types/react": "latest",
    "@types/react-dom": "latest",
    "@types/node": "latest",
    "@types/webpack-dev-server": "latest",
    "css-loader": "latest",
    "style-loader": "latest",
    "html-webpack-plugin": "latest",
    "mini-css-extract-plugin": "latest",
    "ts-loader": "latest",
    "ts-node": "latest",
    "typescript": "latest",
    "webpack": "latest",
    "webpack-cli": "latest",
    "webpack-dev-server": "latest"
  }
}
```

### `apps/web/src/redux/store.ts`
```ts
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slice/authSlice";
import uiReducer   from "./slice/uiSlice";
import userReducer  from "./slice/userSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui:   uiReducer,
    user: userReducer,
  },
});

// Infer types from the store itself
export type RootState   = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### `apps/web/src/redux/hooks.ts`
```ts
import { useDispatch, useSelector, type TypedUseSelectorHook } from "react-redux";
import type { RootState, AppDispatch } from "./store";

export const useAppDispatch: () => AppDispatch          = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

### `apps/web/src/redux/slice/authSlice.ts`
```ts
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
  user:    { id: string; name: string; email: string } | null;
  token:   string | null;
  loading: boolean;
}

const initialState: AuthState = {
  user:    null,
  token:   null,
  loading: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ user: AuthState["user"]; token: string }>) {
      state.user  = action.payload.user;
      state.token = action.payload.token;
    },
    logout(state) {
      state.user  = null;
      state.token = null;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
  },
});

export const { setCredentials, logout, setLoading } = authSlice.actions;
export default authSlice.reducer;
```

### `apps/web/src/redux/slice/uiSlice.ts`
```ts
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface UiState {
  sidebarOpen: boolean;
  theme:       "light" | "dark";
}

const initialState: UiState = { sidebarOpen: false, theme: "light" };

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleSidebar(state)                              { state.sidebarOpen = !state.sidebarOpen; },
    setTheme(state, action: PayloadAction<UiState["theme"]>) { state.theme = action.payload; },
  },
});

export const { toggleSidebar, setTheme } = uiSlice.actions;
export default uiSlice.reducer;
```

### `apps/web/src/redux/slice/userSlice.ts`
```ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

interface User { id: string; name: string; email: string; }
interface UserState { list: User[]; status: "idle" | "loading" | "succeeded" | "failed"; error: string | null; }

export const fetchUsers = createAsyncThunk<User[], void, { rejectValue: string }>(
  "user/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json() as Promise<User[]>;
    } catch (err) {
      return rejectWithValue((err as Error).message);
    }
  }
);

const userSlice = createSlice({
  name: "user",
  initialState: { list: [], status: "idle", error: null } as UserState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending,   (state)         => { state.status = "loading"; })
      .addCase(fetchUsers.fulfilled, (state, action) => { state.status = "succeeded"; state.list = action.payload; })
      .addCase(fetchUsers.rejected,  (state, action) => { state.status = "failed";    state.error = action.payload ?? null; });
  },
});

export default userSlice.reducer;
```

### Wire store in `apps/web/src/main.tsx`
```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./redux/store";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
```
```

### `apps/web/tsconfig.webpack.json`
```json
{
  "extends": "@repo/config/tsconfig.node.json",
  "compilerOptions": {
    "module": "commonjs",
    "moduleResolution": "node"
  },
  "include": ["webpack.config.ts"]
}
```

### `apps/web/webpack.config.ts`
```ts
import path from "path";
import webpack from "webpack";
import HtmlWebpackPlugin from "html-webpack-plugin";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import type { Configuration as DevServerConfig } from "webpack-dev-server";

interface Config extends webpack.Configuration {
  devServer?: DevServerConfig;
}

const isDev = process.env.NODE_ENV !== "production";

const config: Config = {
  mode:   isDev ? "development" : "production",
  target: "web",

  entry: "./src/main.tsx",

  output: {
    path:       path.resolve(__dirname, "dist"),
    filename:   isDev ? "js/[name].js" : "js/[name].[contenthash:8].js",
    publicPath: "/",
    clean:      true,
  },

  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
    alias: {
      "@":           path.resolve(__dirname, "src"),
      "@repo/ui":    path.resolve(__dirname, "../../packages/ui/src"),
      "@repo/utils": path.resolve(__dirname, "../../packages/utils/src"),
    },
  },

  module: {
    rules: [
      // TypeScript / TSX — transpileOnly for speed; typecheck runs separately
      {
        test:    /\.tsx?$/,
        exclude: /node_modules/,
        use: { loader: "ts-loader", options: { transpileOnly: true, configFile: "tsconfig.json" } },
      },
      // Plain CSS
      {
        test:    /\.css$/,
        exclude: /\.module\.css$/,
        use: [isDev ? "style-loader" : MiniCssExtractPlugin.loader, "css-loader"],
      },
      // CSS Modules (latest css-loader: namedExport false for `import styles from "*.module.css"`)
      {
        test: /\.module\.css$/,
        use: [
          isDev ? "style-loader" : MiniCssExtractPlugin.loader,
          {
            loader:  "css-loader",
            options: {
              modules: {
                localIdentName:         "[name]__[local]--[hash:base64:5]",
                exportLocalsConvention: "camelCase",
                namedExport:            false,
              },
            },
          },
        ],
      },
      // Assets
      {
        test: /\.(png|jpe?g|gif|svg|woff2?|eot|ttf|otf)$/,
        type: "asset/resource",
        generator: { filename: "assets/[name].[hash:8][ext]" },
      },
    ],
  },

  plugins: [
    new HtmlWebpackPlugin({ template: "./public/index.html" }),
    ...(isDev ? [] : [new MiniCssExtractPlugin({ filename: "css/[name].[contenthash:8].css" })]),
  ],

  devServer: {
    port:               3000,
    hot:                true,
    historyApiFallback: true,
    proxy: [{ context: ["/api"], target: "http://localhost:4000" }],
  },

  optimization: {
    splitChunks: { chunks: "all" },
    runtimeChunk: "single",
  },

  devtool: isDev ? "eval-source-map" : "source-map",
};

export default config;
```

### `apps/web/tsconfig.json`
```json
{
  "extends": "@repo/config/tsconfig.react.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*":           ["src/*"],
      "@repo/ui/*":    ["../../packages/ui/src/*"],
      "@repo/utils/*": ["../../packages/utils/src/*"]
    }
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

---

## Node + Webpack (JavaScript `.js`)

Bundles server into a single `dist/server.js` — ideal for Docker / Lambda deployments.

```
apps/api/
├── src/                        ← same Express structure (Variant X / Z)
├── webpack.config.js
├── babel.config.js
└── package.json
```

### `apps/api/package.json`
```json
{
  "name": "api",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev":   "webpack --mode development --watch",
    "build": "webpack --mode production",
    "start": "node dist/server.js",
    "lint":  "eslint src/",
    "test":  "jest",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "@repo/utils": "*",
    "express": "latest",
    "cors": "latest",
    "helmet": "latest"
  },
  "devDependencies": {
    "@babel/core": "latest",
    "@babel/preset-env": "latest",
    "babel-loader": "latest",
    "webpack": "latest",
    "webpack-cli": "latest",
    "webpack-node-externals": "latest"
  }
}
```

### `apps/api/babel.config.js`
```js
module.exports = {
  presets: [
    ["@babel/preset-env", { targets: { node: "current" } }],
  ],
};
```

### `apps/api/webpack.config.js`
```js
const path          = require("path");
const nodeExternals = require("webpack-node-externals");

const isDev = process.env.NODE_ENV !== "production";

/** @type {import('webpack').Configuration} */
module.exports = {
  mode:   isDev ? "development" : "production",
  target: "node",                       // ← never bundle Node built-ins

  entry:  "./src/index.js",

  output: {
    path:     path.resolve(__dirname, "dist"),
    filename: "server.js",
    clean:    true,
  },

  externals: [nodeExternals()],         // keeps node_modules out of bundle

  resolve: {
    extensions: [".js", ".json"],
    alias: {
      "@repo/utils": path.resolve(__dirname, "../../packages/utils/src"),
    },
  },

  module: {
    rules: [
      { test: /\.js$/, exclude: /node_modules/, use: "babel-loader" },
    ],
  },

  node: { __dirname: false, __filename: false },

  devtool: isDev ? "eval-source-map" : "source-map",
};
```

---

## Node + Webpack (TypeScript `.ts`)

```
apps/api/
├── src/                        ← same Express/Fastify TS structure
├── webpack.config.ts
├── tsconfig.json
├── tsconfig.webpack.json
└── package.json
```

### `apps/api/package.json`
```json
{
  "name": "api",
  "version": "0.0.1",
  "private": true,
  "ts-node": { "project": "tsconfig.webpack.json" },
  "scripts": {
    "dev":       "webpack --mode development --watch",
    "build":     "webpack --mode production",
    "start":     "node dist/server.js",
    "typecheck": "tsc --noEmit",
    "lint":      "eslint src/",
    "test":      "jest",
    "clean":     "rm -rf dist"
  },
  "dependencies": {
    "@repo/types": "*",
    "@repo/utils": "*",
    "express": "latest",
    "cors": "latest",
    "helmet": "latest",
    "zod": "latest"
  },
  "devDependencies": {
    "@repo/config":           "*",
    "@types/express": "latest",
    "@types/cors": "latest",
    "@types/node": "latest",
    "ts-loader": "latest",
    "ts-node": "latest",
    "typescript": "latest",
    "webpack": "latest",
    "webpack-cli": "latest",
    "webpack-node-externals": "latest"
  }
}
```

### `apps/api/tsconfig.webpack.json`
```json
{
  "extends": "@repo/config/tsconfig.node.json",
  "compilerOptions": { "module": "commonjs", "moduleResolution": "node" },
  "include": ["webpack.config.ts"]
}
```

### `apps/api/webpack.config.ts`
```ts
import path from "path";
import webpack from "webpack";
import nodeExternals from "webpack-node-externals";

const isDev = process.env.NODE_ENV !== "production";

const config: webpack.Configuration = {
  mode:   isDev ? "development" : "production",
  target: "node",

  entry: "./src/index.ts",

  output: {
    path:     path.resolve(__dirname, "dist"),
    filename: "server.js",
    clean:    true,
  },

  externals: [nodeExternals() as webpack.ExternalsPlugin],

  resolve: {
    extensions: [".ts", ".js", ".json"],
    alias: {
      "@repo/types": path.resolve(__dirname, "../../packages/types/src"),
      "@repo/utils": path.resolve(__dirname, "../../packages/utils/src"),
    },
  },

  module: {
    rules: [
      {
        test:    /\.tsx?$/,
        exclude: /node_modules/,
        use: { loader: "ts-loader", options: { transpileOnly: true, configFile: "tsconfig.json" } },
      },
    ],
  },

  node: { __dirname: false, __filename: false },

  devtool: isDev ? "eval-source-map" : "source-map",
};

export default config;
```

### `apps/api/tsconfig.json`
```json
{
  "extends": "@repo/config/tsconfig.node.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "baseUrl": ".",
    "paths": {
      "@repo/types/*": ["../../packages/types/src/*"],
      "@repo/utils/*": ["../../packages/utils/src/*"]
    }
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

---

## `turbo.json` for Webpack Apps

```jsonc
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": [
        "src/**", "public/**",
        "webpack.config.*", "babel.config.*",
        "tsconfig*.json", "package.json"
      ],
      "outputs": ["dist/**"],
      "env": [
        "NODE_ENV",
        "PUBLIC_PATH",
        "API_BASE_URL",
        "PORT",
        "API_PORT",
        "WEB_PORT"
      ]
    },
    "dev": { "cache": false, "persistent": true },
    "typecheck": {
      "dependsOn": ["^build"],
      "inputs": ["src/**/*.{ts,tsx}", "tsconfig.json"]
    }
  }
}
```

**Shell `PUBLIC_PATH`**: `loadEnv()` restores CLI values after dotenv (`override: false`). If webpack still shows `/` after `PUBLIC_PATH='/qa/{root folder name}' npm run preview`, Turbo served a **cache hit** — run `npm run build -- --force` or see `.cursor/rules/turbo-env-cache.mdc`.

---

## Common Webpack + Turbo Pitfalls

| Problem | Fix |
|---|---|
| `webpack.config.ts` fails to parse | Add `ts-node` devDep + `"ts-node": { "project": "tsconfig.webpack.json" }` in `package.json` |
| Internal package changes not reflected | Point webpack `alias` to `src/`, not `dist/` |
| `__dirname` is wrong in Node bundle | Set `node: { __dirname: false }` in webpack config |
| Large Node bundle | Always use `webpack-node-externals` for server builds |
| Shared packages not resolving | Add all internal packages to `resolve.alias` |
| Hot reload not working | `hot: true` + `historyApiFallback: true` in `devServer`; `webpack --watch` for Node |
| CSS class name conflicts | Use `.module.css` with `localIdentName` |
| Production build too slow | `transpileOnly: true` in `ts-loader` + separate `typecheck` Turbo task |

---

## Global Preview System — Single Port, Production Build, .env Controlled

Adds `pnpm preview` to the root. It builds everything, starts all apps as background
processes, then runs a single reverse-proxy on one port defined in `.env`.
`pnpm preview:stop` kills every background process cleanly.

Full script source: **Reference — preview scripts** (below).

### Task-complete verification (IM platform — required)

Before marking work done:

```bash
# {root folder name} = basename of monorepo root (do not hardcode a project slug)
PUBLIC_PATH='/qa/{root folder name}' NODE_ENV=production npm run preview
```

| Check | URL |
|---|---|
| Local API health | `http://127.0.0.1:{PORT}/qa/{root folder name}/api/health` |
| Public API health | `https://imagent.identixweb.com/qa/{root folder name}/api/health` |
| Public frontend | `https://imagent.identixweb.com/qa/{root folder name}/` |

Then `npm run preview:stop`. Details: `.cursor/rules/architecture.mdc` § 4.3, `.cursor/rules/pre-work-requirements.mdc` § 6.

---

### Root-level `.env` (committed as `.env.example`, gitignored as `.env`)

```
# .env  (root of monorepo — loaded by all preview scripts)

# Single public-facing port the proxy listens on
PORT=8080

# Public path prefix (set to /myapp/ if served under a subpath, else /)
PUBLIC_PATH=/

# Internal ports — each app binds to its own; proxy routes to them
WEB_PORT=3001
API_PORT=4000

# Base URL the React app uses for all API calls
API_BASE_URL=http://localhost:4000

# Node environment for production preview
NODE_ENV=production
```

### Root-level `.env.example`
```
PORT=8080
PUBLIC_PATH=/
WEB_PORT=3001
API_PORT=4000
API_BASE_URL=http://localhost:4000
NODE_ENV=production
```

Add to root `.gitignore`:
```
.env
.preview.pids
.preview.ports
preview-*.log
```

### MySQL — `{db_name}` per `{monorepo}`

When `apps/api` uses **MySQL + Knex**:

- **`DB_NAME={db_name}`** in `{monorepo}/.env` — unique per app; child apps **MUST NOT** use `{platform_db_name}` (`im_agent_local`).
- **`loadEnv({ rootDir: ROOT })`** — `ROOT` = monorepo root; `applyProjectDatabaseEnv` forces `DB_NAME` from root `.env` (`env-variables.mdc`).
- Docker: `DB_HOST=db` from shell/container wins over `.env` `localhost`.

```bash
# {monorepo}/.env.example
DB_HOST=localhost
DB_NAME={db_name}
```

| Script | Purpose |
|--------|---------|
| `npm run db:init` | Create `{db_name}` when absent + migrate |
| `npm run db:migrate` | Migrations only |
| Corrupt `knex_migrations` | Drop/recreate `{db_name}` (dev), then `db:init` — not fixed by `db:init` alone |

**Examples:** `{root folder name}` `login` → `{db_name}` `login_app`. Architecture: `.cursor/rules/architecture.mdc` § 3.1–3.2.

---

### Root `package.json` — preview scripts

```json
{
  "name": "my-monorepo",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev":           "turbo run dev",
    "build":         "turbo run build",
    "test":          "turbo run test",
    "lint":          "turbo run lint",
    "clean":         "turbo run clean",

    "preview":       "turbo run build && node scripts/preview-start.js",
    "preview:stop":  "node scripts/preview-stop.js"
  },
  "devDependencies": {
    "turbo":                  "latest",
    "dotenv": "latest",
    "express": "latest",
    "http-proxy-middleware": "latest",
    "cross-env": "latest"
  }
}
```

---

### Preview port probing (required in `preview-start.js`)

Probe `127.0.0.1` for free **`PORT`** (preferred `8080`) and **`API_PORT`** (preferred `4000`, scan upward to `9999` if busy). Write `.preview.ports`. Pass resolved values to **both** `apps/api` and `scripts/proxy.js` via a **shell env prefix** on spawn (`PUBLIC_PATH='…' PORT=… API_PORT=…`) — not a spawn `env` object.

---

### `scripts/preview-start.js`

Reads root `.env` (via `loadEnv` with `rootDir` = monorepo root), **`ensureDatabaseForPreview()`** (`db:migrate`, then `db:init` if schema missing; corrupt-migration error with fix hints), **resolves free `PORT` + `API_PORT`**, starts api + proxy in the **background**, writes `.preview.pids` + `.preview.ports`, then exits. → **Reference — preview scripts**

### `scripts/proxy.js`

Single express server on `127.0.0.1:{PORT}`. Routes `{PUBLIC_PATH}/api/*` → API, static `apps/web/dist`, SPA fallback. Uses `loadEnv` + CLI restore. **Do not** mount `app.use('/api', proxy)` — use an explicit API path matcher. → **Reference — preview scripts**

### `scripts/preview-stop.js`

Kills PIDs from `.preview.pids`; frees ports from `.preview.ports` (fallback: env) via `fuser -k`. → **Reference — preview scripts**

---

### Reference — preview scripts

Copy each block into `{monorepo}/scripts/` (requires `@repo/config/loadEnv`, `apps/api/dist`, `apps/web/dist`).

#### `preview-start.js`

```js
const { spawn, execSync } = require("child_process")
const path = require("path")
const fs = require("fs")
const net = require("net")
const { loadEnv, findMonorepoRoot } = require("@repo/config/loadEnv")

const ROOT = findMonorepoRoot(path.join(__dirname, ".."))
const cliPublicPath = process.env.PUBLIC_PATH
const cliPort = process.env.PORT
const cliApiPort = process.env.API_PORT
loadEnv({ rootDir: ROOT })
if (cliPublicPath) process.env.PUBLIC_PATH = cliPublicPath
if (cliPort) process.env.PORT = cliPort
if (cliApiPort) process.env.API_PORT = cliApiPort

/** MySQL: migrate before preview; init if DB missing (architecture.mdc § 3.2) */
function ensureDatabaseForPreview() {
  const apiDir = fs.existsSync(path.join(ROOT, "apps/api"))
    ? path.join(ROOT, "apps/api")
    : path.join(ROOT, "app/backend")
  const run = (script) => {
    console.log(`[preview] npm run ${script} (${apiDir}) DB_NAME=${process.env.DB_NAME}`)
    execSync(`npm run ${script}`, { cwd: apiDir, stdio: "inherit", env: process.env })
  }
  try {
    run("db:migrate")
  } catch (err) {
    const msg = String(err.message || err)
    if (/corrupt|migration directory/i.test(msg)) {
      console.error(
        "[preview] Knex migration directory is corrupt — usually wrong DB_NAME.",
        "Set DB_NAME={db_name} in {monorepo}/.env (not {platform_db_name}),",
        "DROP/CREATE that schema in dev, then: npm run db:init --workspace=api"
      )
      throw err
    }
    console.log("[preview] db:migrate failed — running db:init (missing schema only)")
    run("db:init")
  }
}

const isPortAvailable = (port) =>
  new Promise((resolve) => {
    const server = net.createServer()
    server.once("error", () => resolve(false))
    server.once("listening", () => {
      server.close()
      resolve(true)
    })
    server.listen(port, "127.0.0.1")
  })

const findAvailablePort = async (start, end = 9999) => {
  const base = parseInt(start, 10) || 4000
  for (let port = base; port <= end; port++) {
    if (await isPortAvailable(port)) return port
  }
  throw new Error(`No free port in range ${base}–${end}`)
}

async function main() {
  ensureDatabaseForPreview()

  const preferredPort = parseInt(process.env.PORT || "8080", 10)
  const preferredApiPort = parseInt(process.env.API_PORT || "4000", 10)
  const PORT = await findAvailablePort(preferredPort)
  const API_PORT = await findAvailablePort(preferredApiPort)
  if (PORT !== preferredPort) {
    console.log(`[preview] PORT ${preferredPort} in use → ${PORT}`)
  }
  if (API_PORT !== preferredApiPort) {
    console.log(`[preview] API_PORT ${preferredApiPort} in use → ${API_PORT}`)
  }
  process.env.PORT = String(PORT)
  process.env.API_PORT = String(API_PORT)

  const PUBLIC_PATH = (process.env.PUBLIC_PATH || "/").replace(/\/$/, "") || "/"
  const previewPath = PUBLIC_PATH.startsWith("/") ? PUBLIC_PATH : `/${PUBLIC_PATH}`
  const pidFile = path.join(ROOT, ".preview.pids")
  const pids = []

  const envPrefix = `PUBLIC_PATH='${PUBLIC_PATH.replace(/'/g, "'\\''")}' PORT=${PORT} API_PORT=${API_PORT} NODE_ENV=production`

  function startBackground(label, shellCmd, cwd) {
    const logPath = path.join(ROOT, `preview-${label}.log`)
    const logFd = fs.openSync(logPath, "a")
    const proc = spawn("sh", ["-c", `${envPrefix} ${shellCmd}`], {
      cwd,
      detached: true,
      stdio: ["ignore", logFd, logFd],
    })
    proc.unref()
    fs.closeSync(logFd)
    pids.push(proc.pid)
    console.log(`[preview] ${label} started in background (pid ${proc.pid}, log ${logPath})`)
    return proc
  }

  startBackground("api", `${process.execPath} dist/index.js`, path.join(ROOT, "apps/api"))
  startBackground("proxy", `${process.execPath} ${path.join(__dirname, "proxy.js")}`, ROOT)

  const portsFile = path.join(ROOT, ".preview.ports")
  fs.writeFileSync(portsFile, `PORT=${PORT}\nAPI_PORT=${API_PORT}\n`)
  fs.writeFileSync(pidFile, pids.join("\n") + "\n")
  console.log(
    `[preview] Ready → proxy http://127.0.0.1:${PORT}${previewPath} | API http://127.0.0.1:${API_PORT}`
  )
}

main().catch((err) => {
  console.error("[preview] failed:", err.message)
  process.exit(1)
})
```

#### `proxy.js`

```js
const express = require("express")
const path = require("path")
const { createProxyMiddleware } = require("http-proxy-middleware")
const { loadEnv, findMonorepoRoot } = require("@repo/config/loadEnv")

const ROOT = findMonorepoRoot(path.join(__dirname, ".."))

const cliPublicPath = process.env.PUBLIC_PATH
const cliPort = process.env.PORT
const cliApiPort = process.env.API_PORT
loadEnv({ rootDir: ROOT })
if (cliPublicPath) process.env.PUBLIC_PATH = cliPublicPath
if (cliPort) process.env.PORT = cliPort
if (cliApiPort) process.env.API_PORT = cliApiPort

const PORT = parseInt(process.env.PORT || "8080", 10)
const API_PORT = parseInt(process.env.API_PORT || "4000", 10)
const PUBLIC_PATH = (process.env.PUBLIC_PATH || "/").replace(/\/$/, "") || ""
const prefix = PUBLIC_PATH === "" ? "" : PUBLIC_PATH
const webDist = path.join(ROOT, "apps/web/dist")

const app = express()

const apiPathMatcher = (pathname) => {
  const apiRoot = prefix ? `${prefix}/api` : "/api"
  return pathname === apiRoot || pathname.startsWith(`${apiRoot}/`)
}

const rewriteApiPath = (pathname) => {
  if (prefix && pathname.startsWith(`${prefix}/api`)) {
    return pathname.slice(prefix.length)
  }
  return pathname
}

if (!Number.isFinite(API_PORT)) {
  console.error("[proxy] Invalid API_PORT — set via preview-start or API_PORT= in env")
  process.exit(1)
}

const apiProxy = createProxyMiddleware({
  target: `http://127.0.0.1:${API_PORT}`,
  changeOrigin: true,
  pathRewrite: rewriteApiPath,
})

app.use((req, res, next) => {
  if (!apiPathMatcher(req.path)) return next()
  return apiProxy(req, res, next)
})

const staticMount = prefix || "/"
app.use(staticMount, express.static(webDist, { index: false }))

app.get("*", (req, res, next) => {
  if (apiPathMatcher(req.path)) {
    return res.status(502).json({
      error: "API proxy misconfigured",
      path: req.path,
      publicPath: prefix || "/",
    })
  }
  if (/\.[a-z0-9]+(\?.*)?$/i.test(req.path)) {
    return res.status(404).type("text/plain").send("Not found")
  }
  res.sendFile(path.join(webDist, "index.html"))
})

app.listen(PORT, "127.0.0.1", () => {
  console.log(
    `[proxy] http://127.0.0.1:${PORT}${prefix || "/"} | PUBLIC_PATH=${prefix || "/"} API_PORT=${API_PORT}`
  )
})
```

#### `preview-stop.js`

```js
const fs = require("fs")
const path = require("path")
const { execSync } = require("child_process")

const ROOT = path.resolve(__dirname, "..")
const pidFile = path.join(ROOT, ".preview.pids")

function killPid(pid) {
  try {
    process.kill(pid, "SIGTERM")
  } catch {
    // already dead
  }
}

if (fs.existsSync(pidFile)) {
  const pids = fs.readFileSync(pidFile, "utf8").trim().split("\n").filter(Boolean)
  pids.forEach((pid) => killPid(Number(pid)))
  fs.unlinkSync(pidFile)
  console.log(`[preview] Stopped ${pids.length} process(es)`)
} else {
  console.log("[preview] No .preview.pids file found")
}

const portsFile = path.join(ROOT, ".preview.ports")
let assigned = {}
if (fs.existsSync(portsFile)) {
  assigned = Object.fromEntries(
    fs
      .readFileSync(portsFile, "utf8")
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const i = line.indexOf("=")
        return [line.slice(0, i), line.slice(i + 1)]
      })
  )
  fs.unlinkSync(portsFile)
}

const ports = [
  assigned.PORT || process.env.PORT,
  assigned.API_PORT || process.env.API_PORT,
  process.env.WEB_PORT,
].filter(Boolean)
for (const port of ports) {
  try {
    execSync(`fuser -k ${port}/tcp 2>/dev/null || true`, { stdio: "ignore" })
  } catch {
    // ignore
  }
}
```

---

### Fix: `PUBLIC_PATH` in webpack configs

Pass `PUBLIC_PATH` from `.env` into webpack's `output.publicPath` so asset URLs
are correct when the app is served under a subpath.

#### `apps/web/webpack.config.js`
```js
require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });

module.exports = {
  // ...
  output: {
    path:       require("path").resolve(__dirname, "dist"),
    filename:   isDev ? "js/[name].js" : "js/[name].[contenthash:8].js",
    publicPath: process.env.PUBLIC_PATH || "/",   // ← from root .env
    clean:      true,
  },
  // ...
};
```

#### `apps/web/webpack.config.ts`
```ts
import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const config: Config = {
  // ...
  output: {
    path:       path.resolve(__dirname, "dist"),
    filename:   isDev ? "js/[name].js" : "js/[name].[contenthash:8].js",
    publicPath: process.env.PUBLIC_PATH ?? "/",   // ← from root .env
    clean:      true,
  },
  // ...
};
```

Add `dotenv` to devDependencies if not already present:
```json
{ "devDependencies": { "dotenv": "latest" } }
```

---

### Fix: API base path in React apps (subpath preview / IM deploy)

`proxy.js` and platform nginx **only** forward paths that include `/api` after `PUBLIC_PATH`:

| `PUBLIC_PATH` | Browser request (correct) | Browser request (404) |
|---|---|---|
| `/` | `/api/v1/...` | `/v1/...` |
| `/qa/{root folder name}` | `/qa/{root folder name}/api/v1/...` | `/qa/{root folder name}/v1/...` |

Typical production error when `PUBLIC_PATH='/qa/{root folder name}'`:

```text
Cannot POST /qa/{root folder name}/v1/...   ← missing /api
```

Correct URL: `POST /qa/{root folder name}/api/v1/...`

**Contract:** In production preview / subpath deploy, `__API_BASE_URL__` = normalized `PUBLIC_PATH` (e.g. `/qa/{root folder name}`). Every `apiFetch` path **MUST** start with `/api/...` (the `/api` segment is in the **endpoint**, not duplicated in the base).

#### `packages/utils/src/http.ts` (or `.js`) — shared API fetcher

```ts
const API_BASE: string =
  typeof __API_BASE_URL__ !== "undefined" ? __API_BASE_URL__ : "/api";

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${API_BASE}${path}`;

  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

// ✅ CORRECT — endpoint includes /api (required when base is PUBLIC_PATH in prod)
// await apiFetch("/api/v1/...", { method: "POST", body: JSON.stringify(payload) });

// ❌ WRONG — 404: Cannot POST /qa/{root folder name}/v1/...
// await apiFetch("/v1/...", { method: "POST", body: ... });
```

#### Inject `__API_BASE_URL__` via webpack `DefinePlugin`

Use validated `env` from `apps/web/src/config/env.js` (after `loadEnv()`). **Do not** inject `API_BASE_URL` (`http://localhost:4000`) for browser builds.

```js
// apps/web/webpack.config.js
const webpack = require("webpack");
const { loadEnv, findMonorepoRoot } = require("@repo/config/loadEnv");
const path = require("path");

const ROOT = findMonorepoRoot(path.join(__dirname, "../.."));
loadEnv({ rootDir: ROOT });
const { env } = require("./src/config/env");

const isDev = process.env.NODE_ENV !== "production";
const publicPath = String(env.PUBLIC_PATH || "/").replace(/\/$/, "") || "";

const browserApiBase = isDev
  ? "/api"
  : publicPath === "" || publicPath === "/"
    ? "/api"
    : publicPath; // e.g. /qa/{root folder name} — endpoints must be /api/v1/...

module.exports = {
  plugins: [
    new webpack.DefinePlugin({
      __API_BASE_URL__: JSON.stringify(browserApiBase),
    }),
  ],
};
```

```ts
// apps/web/src/types/globals.d.ts
declare const __API_BASE_URL__: string;
```

#### Dev server proxy — no change

```js
devServer: {
  proxy: [{ context: ["/api"], target: `http://localhost:${env.API_PORT}` }],
}
```

| Mode | `__API_BASE_URL__` | `apiFetch("/api/v1/foo")` resolves to |
|---|---|---|
| dev | `/api` | `/api/v1/foo` → devServer proxy → API |
| prod `PUBLIC_PATH=/` | `/api` | `/api/v1/foo` → `proxy.js` → API |
| prod `PUBLIC_PATH=/qa/{root folder name}` | `/qa/{root folder name}` | `/qa/{root folder name}/api/v1/...` → `proxy.js` → API |

After `PUBLIC_PATH='/qa/{root folder name}' npm run build`, run `npm run preview` and verify:

```bash
ROOT_FOLDER="$(basename "$(pwd)")"
PORT=8080   # from .preview.ports or logs
curl -sf "http://127.0.0.1:${PORT}/qa/${ROOT_FOLDER}/api/health"
curl -sf -X POST "http://127.0.0.1:${PORT}/qa/${ROOT_FOLDER}/api/v1/..." \
  -H "Content-Type: application/json" -d '{}'
```

---

### Fix: API `basePath` in Express (`apps/api`)

Mount the API router under `/api` so upstream paths stay `/api/v1/...`:

```ts
// apps/api/src/app.ts
app.use("/api", router);   // /api/health, /api/v1/..., etc.
```

`proxy.js` rewrites `{PUBLIC_PATH}/api/...` → `/api/...` on the API port (see **Reference — preview scripts** → `proxy.js`).

---

### Summary — `scripts/` folder at monorepo root

```
scripts/
├── preview-start.js   ← builds then starts all apps in background + proxy
├── preview-stop.js    ← kills all preview processes and frees ports
└── proxy.js           ← single-port reverse proxy (serves web + /api)
```

### Summary — root-level files added

```
my-monorepo/
├── .env               ← PORT, PUBLIC_PATH, API_PORT, API_BASE_URL (gitignored)
├── .env.example       ← committed template
├── scripts/
│   ├── preview-start.js
│   ├── preview-stop.js
│   └── proxy.js
└── package.json       ← "preview" + "preview:stop" scripts
```

### Flow

```
pnpm preview
  └── turbo run build          (all packages built in dependency order)
  └── preview-start.js
        ├── starts api          background, port API_PORT
        ├── writes .preview.pids
        └── starts proxy.js     foreground, port PORT
              ├── GET /api/* → http://localhost:API_PORT
              └── GET /*     → apps/web/dist (SPA fallback)

pnpm preview:stop
  └── preview-stop.js
        ├── kills pids from .preview.pids
        └── kills by port: PORT, API_PORT, WEB_PORT (fallback)
```
