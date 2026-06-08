# React Security and Performance

Frontend guardrails for secure and responsive React applications.

## Security standards

- Treat all user and API-provided content as untrusted.
- Avoid `dangerouslySetInnerHTML` unless sanitized and reviewed.
- Never store secrets/tokens in source code or logs.
- Prefer secure cookie/session strategy over localStorage for sensitive auth data (per backend policy).
- Validate and encode URL/query-driven state before use.
- Restrict third-party scripts and apply CSP where applicable.

## Performance standards

- Split code by route/feature (`lazy`, dynamic import).
- Virtualize long lists and data tables.
- Memoize expensive computation only when measured beneficial.
- Keep context values stable to avoid global re-renders.
- Optimize image loading (sizes, format, lazy load).
- Monitor Web Vitals (LCP, INP, CLS) on production builds.

## Rendering efficiency

- Keep component trees shallow for hot paths.
- Avoid inline object/array props to memoized children.
- Move heavy transforms into selectors or `useMemo`.

```tsx
const visibleRows = useMemo(
  () => rows.filter((r) => r.status === filter),
  [rows, filter]
);
```

## UI reliability checklist

- [ ] Loading, error, and empty states defined
- [ ] Error boundary added at route/feature level
- [ ] Keyboard/focus behavior tested for dialogs/forms
- [ ] Duplicate fetches eliminated across parent/child
- [ ] Bundle size impact reviewed for new dependencies
