---
name: react-standards
description: React component, hooks, state, and performance standards. Always apply with javascript-advanced for .jsx/.js and typescript for .tsx/.ts UI code. Use when building or reviewing React, Next.js, or AI-generated UI.

---

# React Standards

## 0. Language baseline (required)

React UI code **also** follows the language leaf skills and rules:

| File type | Skill | Cursor rule |
|-----------|--------|-------------|
| `.js`, `.jsx` | [../javascript-advanced/SKILL.md](../javascript-advanced/SKILL.md) | `javascript-stack.mdc` |
| `.ts`, `.tsx` | [../typescript/SKILL.md](../typescript/SKILL.md) | `typescript-stack.mdc` |

- **JavaScript:** modern ES6+ syntax, modules, async patterns, naming from JS skill.
- **TypeScript:** typed props, `unknown` in catch, no blind `as` casts; use **Zod** (or similar) for untrusted API/env data when applicable.
- Prefer **`.tsx` + TypeScript** for new components unless the repo is JavaScript-only.

## 1. Component structure

- **One component per file** for non-trivial UI; colocate tests and styles using team convention (`Component.tsx`, `Component.test.tsx`).
- **Order inside files:** imports → types → constants → component → subcomponents → hooks (if file-local) → helpers.
- **Presentational vs container:** prefer hooks + thin JSX for screens; extract reusable visuals early.

```tsx
type Props = { userId: string; onSignedOut: () => void };

export function UserMenu({ userId, onSignedOut }: Props) {
  const { data, isPending, error } = useUser(userId);
  if (isPending) return <Skeleton />;
  if (error) return <InlineError error={error} />;
  return <Menu user={data} onSignOut={onSignedOut} />;
}
```

## 2. Naming and files

- Components: `PascalCase`. Hooks: `useThing`. Event handlers: `handleSubmit`, `onClick` props mirror DOM convention.
- Files: `PascalCase` for components (`UserMenu.tsx`); `camelCase` for non-component modules.

## 3. State management

- **Local state** for UI-only concerns (open/close, inputs with local validation).
- **Server state** via dedicated clients (TanStack Query, RTK Query, etc.): cache, dedupe, stale times explicit.
- **Global client state** minimized; prefer URL/search params for shareable view state when possible.

## 4. Forms — Formik + Yup (required)

When a screen has **validated inputs** (required fields, email/password rules, cross-field checks):

- **Formik** for form state, submit lifecycle, and field components (`<Field>`, `useFormik`).
- **Yup** for `validationSchema` — single source of truth for client-side rules.
- Surface `errors` + `touched`; disable submit on `isSubmitting`; wire `aria-*` on invalid fields.

Do **not** replace Formik/Yup with raw `useState` + manual validators for standard product forms. Rule detail: `react-stack.mdc` § Forms.

Unvalidated single controls (e.g. debounced search) may stay as controlled components.

## 5. Hooks — rules

- Follow **Rules of Hooks** unconditionally. Custom hooks must start with `use` and return stable shapes (objects: memoize if consumers depend on referential equality).
- **`useEffect`:** synchronize with external systems; avoid fetching in `useEffect` when a query library handles lifecycle—use the library’s API.
- **Dependencies:** exhaustive and honest; no empty deps on effects that use changing values.

```tsx
useEffect(() => {
  const sub = bus.subscribe('tick', onTick);
  return () => sub.unsubscribe();
}, [onTick]);
```

## 6. Rendering performance

- **`memo`/`useMemo`/`useCallback`:** apply when profiling shows benefit or when passing callbacks to heavy memoized children—**not by default**.
- **List virtualization** for long tables/lists (`react-window`, TanStack Virtual).
- **Code splitting:** `React.lazy` + `Suspense` for routes and heavy modals; ensure error boundaries.

```tsx
const ReportPanel = lazy(() => import('./ReportPanel'));

export function Dashboard() {
  return (
    <Suspense fallback={<PanelSkeleton />}>
      <ReportPanel />
    </Suspense>
  );
}
```

## 7. Bundle optimization

- **Analyze bundles** (source-map-explorer, vite-bundle-visualizer). Tree-shake ESM dependencies.
- Prefer **platform-aware imports**; avoid importing entire icon sets or lodash monoliths.
- **Images/media:** responsive sources, modern formats; lazy below fold.

## 8. Accessibility and semantics

- Prefer native elements (`button`, `a`, `label`) before ARIA. Keyboard flows and focus management for overlays.
- Test with axe in CI for regressions on critical paths.

## 9. Error boundaries and UX

- Route-level and feature-level **error boundaries**; never blank screens in production.
- **Suspense** boundaries scoped narrowly to avoid full-page flashes.

## 10. Style conventions

- CSS modules, Tailwind, or CSS-in-JS—**pick one per app**. Avoid mixing without isolation strategy.
- Design tokens for color/spacing; no magic numbers scattered in JSX.

## Anti-patterns

- Massive props drilling across 5+ layers—compose or use context sparingly with stable value objects.
- Inline anonymous functions in every render passed to **non-memo** children at scale—measure first, then stabilize.
- Fetching in parent + every child duplicate—centralize queries.

## Cross-references

- JavaScript: [../javascript-advanced/SKILL.md](../javascript-advanced/SKILL.md)
- TypeScript: [../typescript/SKILL.md](../typescript/SKILL.md)
- Node.js (APIs used by React apps): [../nodejs/SKILL.md](../nodejs/SKILL.md)
- Shopify embedded UI: `.cursor/rules/shopify-stack.mdc`
- Reference (layout + examples): [reference/README.md](reference/README.md)
- Redux (RTK): [reference/redux.md](reference/redux.md)
