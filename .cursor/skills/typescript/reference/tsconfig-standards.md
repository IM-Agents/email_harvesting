# TypeScript Config Standards

## Base `tsconfig.json` (strict SPA / Node app)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

## Node ESM service

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

## Monorepo

```
tsconfig.base.json     # shared strict options
apps/api/tsconfig.json # extends base, references packages/types
apps/web/tsconfig.json
packages/types/tsconfig.json
```

Use **project references** (`"references": [{ "path": "../types" }]`) when packages depend on each other.

## Path aliases

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

Mirror aliases in `vite.config.ts` / `jest.config` / `tsconfig paths`—keep a single source of truth.

## Rules

- One **strict** base; apps extend—do not fork conflicting strictness.
- Do not commit `skipLibCheck: false` flip-flop per app without reason.
- Run `tsc -b` or `tsc --noEmit` in CI on every PR.

## Anti-patterns

- `"strict": false` for convenience.
- Disabling `noImplicitAny` only in one package without boundary docs.
- Including `**/*` and accidentally typechecking `dist/` or generated code without exclude.
