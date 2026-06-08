# Architecture (Turborepo) — references

**Canonical standard:** [../SKILL.md](../SKILL.md)
**Suite index:** [../../SKILL.md](../../SKILL.md)

> Unlike other skills in this suite, this folder is named `references/` (plural) and contains one file per scenario rather than a single consolidated reference. Pick the file that matches the work you're doing.

## Reference files

- [react-node-structure.md](react-node-structure.md) — Full production folder layouts for Next.js (App Router), webpack React SPA (JS + TS), Express, Fastify, Node + webpack (JS + TS), Redux (`redux/store` + `redux/slice/`), shared `ui`/`utils` packages, webpack configs, CSS Modules + css-loader v7, the global preview system (`pnpm preview` / `pnpm preview:stop`), single-port reverse proxy, and `PUBLIC_PATH`/`API_BASE_URL` wiring. **Read this first when scaffolding any React or Node app.**
- [typescript.md](typescript.md) — `.ts` / `.tsx` app and package templates, `tsconfig` layout, `tsup` build, shared config package.
- [javascript.md](javascript.md) — `.js` / `.mjs` / `.cjs` app and package templates with no transpile step (ESM and dual ESM+CJS).
- [multi-language.md](multi-language.md) — Python, Go, Rust, shell scripts, and Docker builds orchestrated as Turbo tasks in the same monorepo.

## When to use which

| Scenario | File |
|----------|------|
| New React app or Node API | `react-node-structure.md` |
| New TS library or shared package | `typescript.md` |
| Pure-JS package (no build step) | `javascript.md` |
| Polyglot repo (Python, Go, Rust) | `multi-language.md` |

## Cross-cutting rules

- **Default to webpack** for React apps; use Next.js only for landing pages or SSR/SEO needs.
- **MUST** install latest stable dependencies on scaffold (`npm install <pkg>@latest`); placeholder `"latest"` versions in templates are not pinned semver.
- **MUST** match the active package manager (npm, pnpm, yarn, bun) — pnpm requires `pnpm-workspace.yaml`.
