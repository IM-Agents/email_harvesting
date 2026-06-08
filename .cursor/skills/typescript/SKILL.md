---
name: typescript-standards
description: TypeScript strict typing, tsconfig, generics, narrowing, modules, and tooling standards for Node and React codebases. Use when writing or reviewing .ts/.tsx files, tsconfig, type definitions, Zod schemas, or migrating JavaScript to TypeScript.

---

# TypeScript Standards

**Audience:** engineers and code-generating agents. **Goal:** strict, explicit types with safe boundaries and maintainable configs.

**Baseline:** follow [../javascript-advanced/SKILL.md](../javascript-advanced/SKILL.md) for runtime JS patterns; this skill adds **type-system and compiler** rules.

## 1. Compiler baseline

- Enable **`"strict": true`** in `tsconfig` (do not disable individual strict flags without documented reason).
- Prefer **`"moduleResolution": "bundler"`** (Vite/Next) or **`"node16"`/`"nodenext"`** for Node ESM—one strategy per repo.
- Use **`"noUncheckedIndexedAccess": true`** when greenfield; fix fallout rather than turning off.
- **`"verbatimModuleSyntax": true`** recommended for explicit type-only imports.

Detail: [reference/tsconfig-standards.md](reference/tsconfig-standards.md).

## 2. Typing rules

| Rule | Standard |
|------|----------|
| `any` | Avoid; use `unknown` at boundaries then narrow |
| Public APIs | Explicit parameter and return types |
| Objects | `interface` for extensible shapes; `type` for unions/intersections |
| Constants | `as const` for literal unions; prefer string union types over `enum` unless interop needs enum |
| Nullability | Prefer `undefined` for optional fields; be consistent with APIs |
| Assertions | No `as Foo` without validation—use type guards or schema parse |
| Generics | Name type params (`TData`, `TError`); constrain with `extends` when needed |

```typescript
// boundary parse — preferred over `as`
const body: unknown = await res.json()
const order = orderSchema.parse(body)
```

## 3. Naming and files

- Types/interfaces/enums: `PascalCase` (`OrderDto`, `UserRole`).
- Type-only files: `*.types.ts` or colocated with module—pick one per repo.
- React components: `PascalCase.tsx`; utilities: `kebab-case.ts` or `camelCase.ts` (match JS skill).
- Suffix DTOs/views: `UserResponse`, `CreateOrderInput`—not vague `UserData`.

## 4. Modules and exports

- Use `import type { Foo }` / `export type { Foo }` for type-only symbols when `verbatimModuleSyntax` is on.
- Prefer **named exports**; `export default` only for app/router entrypoints if team allows.
- Avoid circular imports; extract shared types to `types/` or domain package.

## 5. Narrowing and errors

- Use **`in`**, **`typeof`**, **`Array.isArray`**, and **discriminated unions** (`kind: 'ok' | 'err'`) instead of casts.
- Custom type guards: `function isOrder(v: unknown): v is Order { ... }`.
- Catch blocks: treat caught value as `unknown`; narrow before use.

```typescript
function getMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  return 'Unknown error'
}
```

## 6. Runtime validation

- Validate **external** input (HTTP, env, storage, `JSON.parse`) with **Zod**, **Valibot**, or similar at the edge.
- Infer TS types from schemas: `type Order = z.infer<typeof orderSchema>`.
- Do not trust generated/OpenAPI types without runtime check when source is untrusted.

## 7. Async and promises

- Enable **`noFloatingPromises`** / **`@typescript-eslint/no-misused-promises`** in lint config.
- Type async functions with `Promise<T>` return types on public APIs.
- Use `satisfies` to check shape while preserving literal inference.

```typescript
const config = {
  retries: 3,
  timeoutMs: 5000,
} satisfies AppConfig
```

## 8. React + TypeScript

- Props: `type Props = { ... }` or `interface Props` on the component; export only when needed.
- Prefer `ComponentProps<typeof Button>` for wrapper components.
- Avoid `React.FC` default children typing; declare `children` explicitly when required.
- Event handlers: `React.ChangeEvent<HTMLInputElement>`, etc.

See [../react/SKILL.md](../react/SKILL.md).

## 9. Node + TypeScript

- Share types between client/server via `packages/types` or OpenAPI-generated types + runtime validation on ingress.
- Use `import` syntax aligned with `"module"` / `"moduleResolution"`; avoid `require` in new TS code.
- Type `process.env` via schema or `env-schema` module—no unchecked `process.env.FOO!` in prod paths.

See [../nodejs/SKILL.md](../nodejs/SKILL.md).

## 10. Testing

- Type tests with same `tsconfig` as production or stricter `tsconfig.test.json`.
- Use `expectTypeOf` (Vitest) or `@ts-expect-error` sparingly with comment for intentional negative cases.
- Mock with typed interfaces; avoid `as any` in tests—prefer `satisfies` partial mocks.

## Anti-patterns

- `@ts-ignore` / `@ts-nocheck` without ticket and expiry.
- Double assertion `as unknown as T`.
- Empty interfaces used as aliases for `any` behavior.
- Exporting huge ambient `declare global` blocks without review.
- Duplicating types that should be inferred from Zod/OpenAPI.

## Cross-references

- JavaScript runtime: [../javascript-advanced/SKILL.md](../javascript-advanced/SKILL.md)
- React: [../react/SKILL.md](../react/SKILL.md)
- Node.js: [../nodejs/SKILL.md](../nodejs/SKILL.md)
- Reference: [reference/README.md](reference/README.md)
