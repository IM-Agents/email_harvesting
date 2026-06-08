# React Component Patterns

Practical patterns for reusable, testable component design.

## 1) Container + Presentational split

Use when logic is heavy and UI should stay simple.

```tsx
export function UserMenuContainer({ userId }: { userId: string }) {
  const q = useUser(userId);
  if (q.isPending) return <UserMenuSkeleton />;
  if (q.isError) return <InlineError error={q.error} />;
  return <UserMenuView user={q.data} />;
}
```

## 2) Controlled component pattern

Use for reusable form controls.

```tsx
type Props = { value: string; onChange: (v: string) => void };
export function SearchInput({ value, onChange }: Props) {
  return <input value={value} onChange={(e) => onChange(e.target.value)} />;
}
```

## 3) Compound component pattern

Use for flexible APIs (tabs, accordions, menus).

```tsx
<Tabs value={tab} onChange={setTab}>
  <Tabs.List>
    <Tabs.Trigger value="profile">Profile</Tabs.Trigger>
    <Tabs.Trigger value="security">Security</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="profile">...</Tabs.Content>
</Tabs>
```

## 4) Hook extraction pattern

Move stateful logic out of components when reused.

```tsx
function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}
```

## 5) Error + empty + loading states

Every data-driven view should define:

- Loading skeleton/state
- Error state with retry
- Empty state
- Success state

## 6) Pattern selection rule

- Prefer simple components first.
- Promote to pattern only when repeated at least 2-3 times or complexity grows.
