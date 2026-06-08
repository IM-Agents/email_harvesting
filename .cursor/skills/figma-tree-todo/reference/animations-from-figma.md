# Animations from Figma — detect and implement (CSS)

Check whether the design **expects motion** before marking a page done. If animations exist in Figma (or are clearly implied), implement with **CSS** (or the project’s existing motion library) — do not ignore prototype transitions.

## 1. When to check (Required)

| Source | What to look for |
|--------|------------------|
| **Prototype tree** (`POST /api/prototype-tree`) | `transition` on links — e.g. `SMART_ANIMATE`, `DISSOLVE`, `MOVE_IN`, `SLIDE_IN`, `PUSH`, `INSTANT` |
| **Triggers** | `ON_CLICK`, `ON_HOVER`, `AFTER_TIMEOUT`, `MOUSE_ENTER` / `MOUSE_LEAVE` with animated navigation |
| **`CHANGE_TO`** | Variant swaps that imply cross-fade or slide between frames |
| **`OVERLAY`** | Modal/drawer open — often fade + scale |
| **Hover States** section in tree markdown | Component hover variants |
| **`get_design_context`** | Motion hints, “animate”, loading spinners, progress, micro-interactions |
| **User / PRD** | Explicit animation requirements |

**Totals line (add to implementation notes):**

```text
Animations: N (list: hover x2, modal open, tab slide, …)
```

- If **Animations: 0** and design is static → document “no Figma animation”; CSS transitions only for `:hover` / `:focus` if components have hover variants.
- If **Animations: N > 0** → every row **MUST** have a code implementation plan before page sign-off.

---

## 2. Animation inventory table (MUST when N > 0)

| # | Name | nodeId / link | Figma signal | Implementation |
|---|------|---------------|--------------|----------------|
| 1 | Modal open | overlay link | `DISSOLVE` + `OVERLAY` | CSS `opacity` + `transition` on backdrop; optional `transform: scale` |
| 2 | Button hover | 123:10 | Hover variant + `ON_HOVER` | CSS `:hover` — `transition` on `background-color`, `box-shadow` |
| 3 | Tab change | NAVIGATE | `SMART_ANIMATE` / `MOVE_IN` | CSS `transform` / `opacity` on panel swap or route transition class |

Columns to fill:

- **Duration / easing** — from Figma prototype `transition` when API exposes them; else match `get_screenshot` timing (~200–300ms UI, ~400ms modals) and document assumption
- **CSS location** — `*.module.css`, global `@keyframes`, or motion token in `tokens.css`

---

## 3. If not in figma-tree — discover first

Prototype markdown may omit animation detail but Figma file still has transitions.

1. Re-read full prototype-tree output for any `transition:` not `INSTANT` / `null`
2. `get_design_context` on animated nodes (loaders, toggles, carousels)
3. `get_screenshot` — compare frames or ask user if motion is intentional
4. Add missing rows to § 2 inventory

**MUST NOT** ship a carousel, modal, or hover-heavy UI with zero motion when Figma prototype uses `SMART_ANIMATE` or hover variants.

---

## 4. Implementation — CSS first (Required)

Prefer **CSS** unless the project already standardizes Framer Motion / React Spring / GSAP.

| Pattern | CSS approach |
|---------|----------------|
| Hover / focus | `transition: property 200ms ease`; match hover variant colors from MCP |
| Fade in/out | `opacity` + `transition` or `@keyframes fadeIn` |
| Slide / push | `transform: translateX/Y(...)` + `transition` |
| Scale (modal) | `transform: scale(0.95 → 1)` + `opacity` |
| Loading spinner | `@keyframes spin` on icon; duration from design |
| Reduced motion | `@media (prefers-reduced-motion: reduce) { transition: none; animation: none; }` |

**Token example** (`tokens.css`):

```css
:root {
  --motion-duration-fast: 150ms;
  --motion-duration-normal: 250ms;
  --motion-duration-slow: 400ms;
  --motion-ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
}
```

- **MUST** use exact colors/spacing from Figma for start/end states — not only default browser transitions.
- **SHOULD** tie interactive transitions to the same component CSS module as static styles.
- **MUST NOT** add heavy animation libraries for a single hover fade unless the project already uses them.

**If CSS cannot match Figma motion** (complex path morph, spring physics):

1. **context7** — library docs (Framer Motion, etc.) if project has dependency
2. **Web search** — second, with exact Figma transition type + stack
3. Document why CSS was insufficient in task summary

---

## 5. Wire with prototype interactions

| Figma | Code |
|-------|------|
| `ON_HOVER` | CSS `:hover` / `:focus-visible` + `transition` |
| `CHANGE_TO` with animation | State change + CSS class toggle + `transition` / `@keyframes` |
| `OVERLAY` open/close | Class on modal root; animate backdrop + panel |
| `NAVIGATE` with `SMART_ANIMATE` | Route/tab swap with enter/exit classes (CSS) |

- **MUST** verify in browser: trigger matches prototype (click, hover, open modal).
- **SHOULD** compare screen recording or stepped `get_screenshot` if available.

---

## 6. Checklist (per page)

- [ ] Prototype tree scanned for non-`INSTANT` transitions and hover sections
- [ ] **Animations: N** documented; inventory table complete when N > 0
- [ ] Each animation has CSS (or approved library) implementation
- [ ] `prefers-reduced-motion` respected
- [ ] No animation added that is **not** in Figma/PRD (avoid gratuitous motion)
