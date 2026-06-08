# React Folder Structure

Recommended structure for scalable React apps.

## Single app structure

```text
src/
  app/                 # routing, providers, app shell, boundaries
  features/            # vertical slices (auth, billing, orders)
    orders/
      components/
      hooks/
      api/
      state/
      utils/
  entities/            # normalized domain view models/mappers
  shared/              # reusable UI, hooks, helpers, constants
  styles/              # global styles/tokens (if used)
tests/
  e2e/
```

## Monorepo layout

```text
apps/
  web-client/
    src/...
packages/
  ui-kit/              # design system components
  eslint-config/
  tsconfig/
```

## Layering rules

- `features/*` can import from `entities` and `shared`.
- `shared` must not import from `features`.
- Keep API adapters inside each feature (`features/*/api`) unless truly cross-feature.
- Move truly reusable UI to `packages/ui-kit`.

## Naming standards

- Components: `PascalCase.tsx`.
- Hooks: `useSomething.ts`.
- Utility modules: `kebab-case.ts` or team-standardized `camelCase.ts`.
- Feature directories: `kebab-case` (`user-settings`, `order-history`).

## Testing placement

- Unit tests colocated with components/hooks for fast ownership.
- Integration tests under feature-level `__tests__` when flows span modules.
- E2E tests under `tests/e2e`.

## Why this layout

- Keeps dependency direction obvious.
- Reduces accidental coupling across features.
- Improves AI-generated code consistency and maintainability.
