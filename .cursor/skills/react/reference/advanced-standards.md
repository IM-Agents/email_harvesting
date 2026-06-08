# React Advanced Standards

Advanced guidance for performance, rendering behavior, and long-term maintainability.

## 1) Component design

- Keep components focused: one responsibility per component.
- Favor composition over deep inheritance-like wrapper trees.
- Split complex screens into route shell + feature sections.

## 2) State strategy

- Local UI state: `useState` / `useReducer`.
- Server state: query library with caching and retry policy.
- Global client state: only for cross-cutting concerns (theme, auth session view model).
- URL state: use query params for shareable filters/sorts.

## 3) Rendering performance

- Use `memo` for expensive components with stable props.
- Use `useMemo`/`useCallback` only when referential stability matters.
- Virtualize large lists.
- Avoid creating new object/array literals in hot render loops when passed to memoized children.

## 4) Effects and side effects

- `useEffect` synchronizes external systems only.
- Derive state in render when possible; avoid mirror state anti-pattern.
- Always include complete dependency arrays.

## 5) Data fetching

- Prefer query hooks over ad hoc `fetch` inside random components.
- Keep fetch concerns in `features/*/api` or dedicated hooks.
- Model loading/error/success states explicitly.

## 6) Boundaries

- Add route-level error boundaries.
- Scope `Suspense` boundaries around expensive lazy chunks.
- Avoid full-screen fallback for small widget loading.

## 7) Accessibility

- Prefer semantic elements.
- Ensure keyboard navigation in dialogs, menus, and forms.
- Include ARIA only when native semantics are insufficient.

## 8) Bundle discipline

- Lazy-load routes and heavy panels.
- Avoid importing full utility/icon libraries.
- Audit bundle regularly with tooling.

## 9) Example: stable derived props

```tsx
const visibleItems = useMemo(
  () => items.filter((i) => i.status === filter),
  [items, filter]
);
```

## 10) Anti-patterns to avoid

- Prop drilling across many layers instead of composition/context boundaries.
- Fetching the same resource in parent and child independently.
- Context values recreated every render without memoization.
- Massive components handling fetching, formatting, and rendering all together.
