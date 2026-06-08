# React — reference

**Canonical standard:** [../SKILL.md](../SKILL.md)  
**Suite index:** [../../SKILL.md](../../SKILL.md)  
**Language (required):** [../../javascript-advanced/SKILL.md](../../javascript-advanced/SKILL.md) · [../../typescript/SKILL.md](../../typescript/SKILL.md)

## Additional reference files

- [folder-structure.md](folder-structure.md) — React project layout and dependency direction.
- [advanced-standards.md](advanced-standards.md) — performance and architecture-level React standards.
- [component-patterns.md](component-patterns.md) — reusable component and hook patterns.
- [security-performance.md](security-performance.md) — React security and performance guardrails.
- [redux.md](redux.md) — Redux Toolkit standards (store, slices, selectors, async, testing).

## Repository layout (frontend app)

```
src/
  app/           # routes, providers, error boundaries
  features/      # vertical slices: orders/, auth/, settings/
  entities/      # mappers, small types shared across features
  shared/        # UI primitives, hooks, API client wrapper
```

In a **monorepo**, the web client often lives under `apps/web-client` with the same `src/` shape inside.

**Rules**

- Colocate tests: `Component.tsx` + `Component.test.tsx` (or agreed pattern).
- **One styling system** per app (Tailwind, CSS modules, etc.) unless isolated packages say otherwise.

## Performance & quality checklist

- Profile before defaulting to `memo` / `useCallback` everywhere.
- Virtualize long lists; code-split routes with `lazy` + `Suspense`.
- **axe** (or equivalent) on critical flows in CI where feasible.

## Code examples

### Stable callback with memoized child

```tsx
import { memo, useCallback, useState } from 'react';

const HeavyRow = memo(function HeavyRow({ id, onSelect }: { id: string; onSelect: (id: string) => void }) {
  return (
    <button type="button" onClick={() => onSelect(id)}>
      {id}
    </button>
  );
});

export function RowList({ ids }: { ids: string[] }) {
  const [active, setActive] = useState<string | null>(null);
  const onSelect = useCallback((id: string) => setActive(id), []);

  return (
    <div>
      <p>Active: {active}</p>
      {ids.map((id) => (
        <HeavyRow key={id} id={id} onSelect={onSelect} />
      ))}
    </div>
  );
}
```

### Server state boundary (TanStack Query–style)

```tsx
import { useQuery } from '@tanstack/react-query';

export function UserPanel({ userId }: { userId: string }) {
  const q = useQuery({ queryKey: ['user', userId], queryFn: () => fetchUser(userId) });

  if (q.isPending) return <Spinner />;
  if (q.isError) return <ErrorBanner error={q.error} />;
  return <Profile user={q.data} />;
}

async function fetchUser(id: string) {
  const res = await fetch(`/api/users/${id}`);
  if (!res.ok) throw new Error('failed');
  return res.json();
}
```

