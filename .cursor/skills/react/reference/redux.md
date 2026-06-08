# Redux Standards (Redux Toolkit)

**Canonical React standard:** [../SKILL.md](../SKILL.md)

Org standard for **global client state** when local state and URL params are not enough. Prefer **Redux Toolkit (RTK)**; do not add legacy `createStore` boilerplate.

---

## 1) When to use Redux

| Use Redux for | Prefer alternatives for |
|---------------|-------------------------|
| Cross-feature client state (auth session view, cart, wizard flow) | Component-local UI (open/close, form draft in one screen) |
| Shared state many distant components need | Server/cache data (RTK Query, TanStack Query) |
| Predictable updates with audit/debug needs | Shareable filters/sort in URL (`searchParams`) |
| Complex client workflows with many actions | One-off props between parent/child |

**Rule:** Redux holds **client domain/UI-global** state—not a replacement for your HTTP cache layer.

---

## 2) Folder structure

```
src/
  app/
    store.ts              # configureStore, root reducer, middleware
    hooks.ts              # typed useAppDispatch, useAppSelector
  features/
    auth/
      authSlice.ts
      authSelectors.ts
      authApi.ts          # optional RTK Query endpoints
    orders/
      ordersSlice.ts
      ordersSelectors.ts
```

**Rules**

- One slice per feature domain; avoid a single mega-slice.
- Colocate selectors with the slice (`featureSelectors.ts` or bottom of slice file).
- Export only public actions/selectors from feature barrels when needed.

---

## 3) Store setup (RTK)

```typescript
// app/store.ts
import { configureStore } from '@reduxjs/toolkit';
import { authReducer } from '../features/auth/authSlice';
import { ordersReducer } from '../features/orders/ordersSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    orders: ordersReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

```typescript
// app/hooks.ts
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './store';

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
```

**Rules**

- **MUST** use typed hooks (`useAppDispatch`, `useAppSelector`) everywhere.
- **MUST NOT** import `store.dispatch` in components except tests/bootstrap.

---

## 4) Slice design

```typescript
// features/orders/ordersSlice.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

type OrdersState = {
  selectedId: string | null;
  statusFilter: 'all' | 'open' | 'closed';
};

const initialState: OrdersState = {
  selectedId: null,
  statusFilter: 'all',
};

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    orderSelected(state, action: PayloadAction<string>) {
      state.selectedId = action.payload;
    },
    filterChanged(state, action: PayloadAction<OrdersState['statusFilter']>) {
      state.statusFilter = action.payload;
    },
    selectionCleared(state) {
      state.selectedId = null;
    },
  },
});

export const { orderSelected, filterChanged, selectionCleared } = ordersSlice.actions;
export const ordersReducer = ordersSlice.reducer;
```

**Rules**

- Use **Immer** via RTK: write “mutating” reducers inside `createSlice`; keep logic synchronous in reducers.
- Keep state **serializable** (no class instances, DOM nodes, functions in state).
- Name slices with feature prefix (`orders/orderSelected` action types).
- Prefer **flat or normalized** entity maps for collections (`entities: Record<id, Entity>`).

---

## 5) Async: `createAsyncThunk` vs RTK Query

### `createAsyncThunk` (imperative flows)

Use for one-off mutations or orchestration that does not fit query caching.

```typescript
import { createAsyncThunk } from '@reduxjs/toolkit';

export const submitOrder = createAsyncThunk(
  'orders/submit',
  async (payload: SubmitOrderDto, { rejectWithValue }) => {
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) return rejectWithValue(await res.json());
      return (await res.json()) as Order;
    } catch (err) {
      return rejectWithValue({ message: 'Network error' });
    }
  }
);
```

Handle in `extraReducers`:

```typescript
extraReducers: (builder) => {
  builder
    .addCase(submitOrder.pending, (state) => {
      state.submitStatus = 'loading';
    })
    .addCase(submitOrder.fulfilled, (state, action) => {
      state.submitStatus = 'succeeded';
      state.entities[action.payload.id] = action.payload;
    })
    .addCase(submitOrder.rejected, (state, action) => {
      state.submitStatus = 'failed';
      state.error = action.payload as ApiError;
    });
},
```

### RTK Query (server state in Redux)

Use when the team standardizes on Redux for **fetch/cache/invalidate** (lists, detail views, mutations with tags).

**Rule:** Do not duplicate the same API data in both a manual slice and RTK Query cache.

---

## 6) Selectors

```typescript
// features/orders/ordersSelectors.ts
import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../app/store';

const selectOrdersState = (state: RootState) => state.orders;

export const selectStatusFilter = createSelector(
  selectOrdersState,
  (s) => s.statusFilter
);

export const selectFilteredOrderIds = createSelector(
  selectOrdersState,
  selectStatusFilter,
  (orders, filter) => {
    if (filter === 'all') return Object.keys(orders.entities);
    return Object.values(orders.entities)
      .filter((o) => o && o.status === filter)
      .map((o) => o!.id);
  }
);
```

**Rules**

- **MUST** use `createSelector` for derived/list data used by memoized children.
- Keep selectors colocated; export memoized selectors, not raw state shape.
- **MUST NOT** compute heavy filters inline in every render without memoization.

---

## 7) Component usage

```tsx
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { filterChanged, orderSelected } from './ordersSlice';
import { selectFilteredOrderIds, selectStatusFilter } from './ordersSelectors';

export function OrderList() {
  const dispatch = useAppDispatch();
  const filter = useAppSelector(selectStatusFilter);
  const orderIds = useAppSelector(selectFilteredOrderIds);

  const handleFilterChange = (next: 'all' | 'open' | 'closed') => {
    dispatch(filterChanged(next));
  };

  return (
  <div>
    <FilterBar value={filter} onChange={handleFilterChange} />
    <ul>
      {orderIds.map((id) => (
        <li key={id}>
          <button type="button" onClick={() => dispatch(orderSelected(id))}>
            {id}
          </button>
        </li>
      ))}
    </ul>
  </div>
  );
}
```

**Rules**

- Dispatch only from event handlers or effects—not during render.
- Select minimal state; avoid `useAppSelector((s) => s)` on large trees.
- Split connected containers from presentational components when lists are heavy.

---

## 8) Provider and DevTools

```tsx
// app/Providers.tsx
import { Provider } from 'react-redux';
import { store } from './store';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <Provider store={store}>{children}</Provider>;
}
```

- Enable Redux DevTools in development only.
- Document any `redux-persist` whitelist; never persist secrets or full PII blobs.

---

## 9) Testing

```typescript
import { configureStore } from '@reduxjs/toolkit';
import { ordersReducer, filterChanged } from './ordersSlice';

describe('ordersSlice', () => {
  it('updates filter', () => {
    const store = configureStore({ reducer: { orders: ordersReducer } });
    store.dispatch(filterChanged('open'));
    expect(store.getState().orders.statusFilter).toBe('open');
  });
});
```

- Unit-test reducers and selectors in isolation.
- Integration-test critical thunks with mocked `fetch`.
- Prefer testing behavior, not implementation details of dispatch call counts.

---

## 10) Anti-patterns

- Storing **server list cache** in manual slices while also using RTK Query/TanStack Query.
- Putting **non-serializable** values in state (Dates okay if team accepts; prefer ISO strings).
- Giant global slice for entire app state.
- Inline `useSelector(state => state.feature.nested.deep)` in hot lists without memoized selectors.
- Dispatching in render or `useEffect` without stable dependencies causing loops.
- Copy-pasting legacy Redux patterns (`connect`, manual action constants) when RTK suffices.

---

## 11) Review checklist

- [ ] Redux used only where global client state is justified
- [ ] RTK slices are feature-scoped and serializable
- [ ] Typed `useAppDispatch` / `useAppSelector` used
- [ ] Async flows use `createAsyncThunk` or RTK Query consistently (not both duplicated)
- [ ] Selectors memoized for derived data
- [ ] No dispatch-on-render; loading/error states explicit in UI
- [ ] Tests cover reducers/selectors for critical paths
