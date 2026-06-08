# TypeScript — reference

**Canonical standard:** [../SKILL.md](../SKILL.md)  
**Suite index:** [../../SKILL.md](../../SKILL.md)

## Additional reference files

- [tsconfig-standards.md](tsconfig-standards.md) — recommended compiler options and project layout.
- [type-patterns.md](type-patterns.md) — generics, unions, utility types, guards, Zod.
- [lint-and-tooling.md](lint-and-tooling.md) — ESLint, tsc CI, path aliases.

## Quick checklist

- [ ] `"strict": true` in base `tsconfig`
- [ ] No unchecked `any`; `unknown` at boundaries
- [ ] External input validated (Zod/schema) before use
- [ ] `import type` for type-only imports
- [ ] `tsc --noEmit` (or build) passes in CI
- [ ] Public functions have explicit return types
