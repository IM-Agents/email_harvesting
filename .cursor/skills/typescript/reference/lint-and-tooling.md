# TypeScript Lint and Tooling

## ESLint (recommended stack)

- `@typescript-eslint/parser` + `typescript-eslint` flat config.
- Extend `eslint:recommended` and `typescript-eslint` strict-type-checked (or stylistic-type-checked) presets.
- Enable:
  - `@typescript-eslint/no-floating-promises`
  - `@typescript-eslint/no-misused-promises`
  - `@typescript-eslint/consistent-type-imports`
  - `@typescript-eslint/no-explicit-any` (warn or error)

## CI pipeline

```bash
tsc --noEmit
eslint "src/**/*.{ts,tsx}"
```

For monorepos: `turbo run typecheck lint` or per-package scripts.

## Formatting

- **Prettier** or **Biome** for format; ESLint for logic/types.
- Do not fight Prettier with ESLint stylistic rules—use `eslint-config-prettier` if needed.

## package.json scripts (example)

```json
{
  "scripts": {
    "typecheck": "tsc --noEmit",
    "lint": "eslint .",
    "check": "npm run typecheck && npm run lint"
  }
}
```

## Migration from JavaScript

1. Enable `allowJs` + `checkJs` optionally for gradual migration.
2. Rename leaf modules to `.ts`; add types at boundaries first.
3. Turn on `strict` per package once errors are bounded.
4. Remove `// @ts-check` file hacks when file is fully typed.

## Anti-patterns

- Relying on IDE only—no `tsc` in CI.
- Different ESLint rules per package without documented reason.
- Committing `.tsbuildinfo` or `dist/` (should be gitignored).
