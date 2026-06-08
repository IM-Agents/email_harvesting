---
name: figma-tree-todo
description: Page-wise Figma implementation checklist — prototype tree, MCP discovery, component inventory, create Button/Carousel/etc. first, then compose page. Use when implementing a screen from Figma, building from prototype tree, or user says "implement this page" / "figma tree todo".
origin: custom
---

# Figma tree todo — page-wise workflow

Complete this checklist **in order** for each page/screen. Do not skip to page layout before components exist.

## Activate when

- User gives a Figma URL, frame id, or section id for **one page**
- User says implement design from Figma page-by-page
- Prototype tree shows tabs, `CHANGE_TO` variant flows, or overlays
- User references `/api/prototype-tree` output

## Prerequisites

- Figma MCP connected (`.cursor/mcp.json` → `figma` server)
- `fileKey`, `nodeId`, and token (or env `FIGMA_API_KEY`)
- Load `.cursor/skills/figma-design/SKILL.md` for MCP tool names
- Read `.cursor/skills/figma-tree-todo/reference/figma-tree-index.md` — read `docs/figma-tree.md` when present; **do not auto-create** if missing
- Read `.cursor/skills/figma-tree-todo/reference/css-from-figma.md` for position, z-index, colors
- Read `.cursor/skills/figma-tree-todo/reference/component-code-validation.md` — validate each component; context7 then web search if invalid
- Read `.cursor/skills/figma-tree-todo/reference/animations-from-figma.md` — detect Figma motion; implement with CSS when needed

---

## Mandatory order (do not skip)

```
0. docs/figma-tree.md → read if present; if missing → ask user (do NOT auto-create file)
1. Prototype tree + align with docs/figma-tree.md or user scope
2. MCP metadata → COUNT components | images | icons (inventory checklist)
3. Discover anything NOT in figma-tree via get_metadata / get_design_context
4. Create code components (Figma MCP) → **validate lint/types after each**; context7 then web search if invalid
5. Get images + icons **from Figma MCP only** → save to assets/images/, assets/icons/
6. Animation audit → if Figma has motion, inventory + CSS (or project motion lib)
7. Tokens + CSS + z-index
8. Compose page → wire interactions + animations
```

---

## Todo checklist

### A. Prototype & scope

- [ ] **A0** — `{monorepo}/docs/figma-tree.md` **read if present**; if missing → **ask user** (see [figma-tree-index.md](reference/figma-tree-index.md)) — **do not auto-create**
- [ ] **A1** — Call `POST /api/prototype-tree` with `{ fileKey, token, nodeId }` (dev: port `4001`)
- [ ] **A2** — Parse markdown: entry frame, `NAVIGATE`, `CHANGE_TO`, `OVERLAY`, hover, **transition** types (`SMART_ANIMATE`, `DISSOLVE`, etc.)
- [ ] **A3** — Read/sync `docs/figma-tree.md`; align routes and node ids; update index if tree has new screens
- [ ] **A4** — Write **Requirements summary** from index **Requirements** + Navigation Tree + tree output (not from guesses)

### B. Figma MCP discovery (this page)

- [ ] **B1** — `whoami` — MCP authenticated
- [ ] **B2** — `get_metadata(fileKey, nodeId)` — confirm frame/section exists
- [ ] **B3** — `get_design_context(fileKey, entryFrameNodeId)` — full page structure
- [ ] **B4** — For each tree destination (tab, slide variant, overlay): `get_design_context` + `get_screenshot`
- [ ] **B5** — `get_variable_defs(fileKey, nodeId)` — **colors**, spacing, radius tokens → `tokens.css`
- [ ] **B6** — `search_design_system` — reuse library components if available

### C0. Inventory counts — components, images, icons (MUST before coding)

**Reference:** [reference/asset-inventory.md](reference/asset-inventory.md)

- [ ] **C0.1** — From `get_metadata` on entry frame (+ linked destinations): **count** `COMPONENT` / `COMPONENT_SET` / `INSTANCE` → **Components: _n_**
- [ ] **C0.2** — Count raster **images** (image fills, photos, illustrations) → **Images: _n_**
- [ ] **C0.3** — Count **icons** (vectors, icon components, small marks) → **Icons: _n_**
- [ ] **C0.4** — Write totals line: `Components: X | Images: Y | Icons: Z` with page `nodeId`
- [ ] **C0.5** — Compare to `docs/figma-tree.md` + prototype tree — list items **not mentioned** in tree
- [ ] **C0.6** — **If not in figma-tree:** `get_metadata` + `get_design_context` on entry frame to **find and add** missing components/images/icons before any code (do not skip unnamed layers)

### C0b. Animation audit (check every page)

**Reference:** [reference/animations-from-figma.md](reference/animations-from-figma.md)

- [ ] **C0b.1** — Scan prototype tree for animated transitions (not `INSTANT` only) and **Hover States**
- [ ] **C0b.2** — Write **`Animations: N`**; if N > 0, fill animation inventory table (trigger, transition type, CSS plan)
- [ ] **C0b.3** — If motion implied but **not in figma-tree** → `get_design_context` / tree re-parse to find before coding
- [ ] **C0b.4** — If N > 0: plan **CSS** `transition` / `@keyframes` (duration, easing); use context7 → web search only if CSS cannot match

### B2. CSS, position & z-index (MUST — before page compose)

**Reference:** [reference/css-from-figma.md](reference/css-from-figma.md)

- [ ] **B7** — From `get_design_context`: extract CSS per component (layout, typography, borders, shadows, opacity)
- [ ] **B8** — From `get_metadata`: record **x, y, width, height** for positioned nodes (backdrops, hotspots, modals)
- [ ] **B9** — Build **stacking order** table — map Figma sibling order → `z-index` (overlay > controls > content)
- [ ] **B10** — **Colors**: map every fill/text/stroke to `get_variable_defs` token or exact MCP hex — no guesses
- [ ] **B11** — Flag absolute-positioned children; ensure parent gets `position: relative` in plan

### C. Component inventory table (do not code page yet)

List every row from **C0** counts — all **COMPONENT**, **COMPONENT_SET**, and **INSTANCE** on the page:

| Figma node | Type | Variants | Position / z-index | Colors (token) | Planned code file |
|------------|------|----------|--------------------|--------------|-------------------|
| Button | COMPONENT | Primary, Ghost | static / flex | `color/primary` | `components/ui/Button.tsx` |
| Carousel | COMPONENT_SET | Variant=1,2,3 | backdrop z-10, hotspot z-2 | `color/bg-surface` | `components/ui/Carousel.tsx` |
| Modal Backdrop | RECTANGLE | — | absolute inset-0 z-10 | `color/overlay` | part of page shell |
| … | | | | | |

- [ ] **C1** — Atoms identified (Button, Input, Text, Icon)
- [ ] **C2** — Composites identified (Carousel, Tabs, Card, Form)
- [ ] **C3** — Overlays/modals listed with destination node ids
- [ ] **C4** — Grep codebase — mark Reuse vs Create for each row
- [ ] **C5** — **Images table** — every image node: `nodeId`, filename, `assets/images/…` path
- [ ] **C6** — **Icons table** — every icon node: `nodeId`, filename, `assets/icons/…` path

### D. Create code components — Figma MCP first (MUST)

**MUST** create all components from **§ C** before downloading assets or composing the page.

Order of creation:

```
1. styles/tokens.css (or theme)     ← get_variable_defs (colors, spacing, radius)
2. components/ui/{Atom}.module.css  ← get_design_context (CSS)
3. components/ui/{Atom}.tsx         ← get_design_context (structure + variants)
4. components/{Composite}.tsx       ← position + z-index from get_metadata
5. (step E) assets/images + assets/icons
6. pages/{PageName}.tsx
7. route registration
```

Per component:

- [ ] **D1** — `get_design_context(fileKey, componentNodeId)` — implement component (exact CSS, variants)
- [ ] **D2** — Fetch `get_variable_defs` — bind colors to CSS variables
- [ ] **D3** — Fetch `get_metadata` — confirm position (x/y) and stacking vs siblings
- [ ] **D4** — Define TypeScript props matching Figma variant properties
- [ ] **D5** — Set `position`, `z-index` for backdrops, hotspots, modals, sticky elements
- [ ] **D6** — Export from barrel `index.ts` if project uses one
- [ ] **D7** — `get_screenshot` compare — colors, layering, spacing

### D8. Validate component code (MUST — after each component)

**Reference:** [reference/component-code-validation.md](reference/component-code-validation.md)

- [ ] **D8.1** — Run project checks on changed files: linter diagnostics, `npm run lint` / `turbo run lint`, `tsc --noEmit` (or repo equivalent)
- [ ] **D8.2** — **MUST** fix all syntax, import, type, and CSS-module errors before the next component
- [ ] **D8.3** — If still invalid: **context7 MCP first** (official docs for failing library/API); then **web search** with exact error + stack version
- [ ] **D8.4** — Re-run validation until pass — do not proceed with broken code
- [ ] **D8.5** — After all components + page file: run package **build** if the project defines it

### E. Images & icons from Figma MCP → `assets/` (MUST)

**Reference:** [reference/asset-inventory.md](reference/asset-inventory.md) — **all assets sourced from Figma MCP only**

- [ ] **E0** — Create folders: `assets/images/`, `assets/icons/` (or `src/assets/…`, `public/…`)
- [ ] **E1** — Each **image**: call Figma MCP `get_screenshot(fileKey, nodeId)`; if `get_design_context` returns image URL → download → `assets/images/{name}.png`
- [ ] **E2** — Each **icon**: Figma MCP `get_design_context` (SVG) or `get_screenshot` (2x PNG) → `assets/icons/{name}.svg` or `.png`
- [ ] **E3** — **MUST NOT** use placeholders, stock art, or non-Figma files when the layer exists in the design file
- [ ] **E4** — Components/page use **local imports** only — no committed Figma CDN hotlinks
- [ ] **E5** — Exported file count matches **Images + Icons** totals from C0

**`CHANGE_TO` variant example** (from prototype tree — name from Figma, not a fixed page):

- Props: `activeVariant: 1 | 2 | 3` or `activeVariantId`
- Hotspot clicks update local state (mirrors Figma prototype)
- Three variant frames from tree: `Variant=1`, `Variant=2`, `Variant=3` — one link each in tree, not eight duplicate hotspot links

### F. Compose page

- [ ] **F1** — Page file imports **only** components + local assets (no duplicated frame markup)
- [ ] **F2** — Layout matches `get_design_context` for entry frame
- [ ] **F3** — Wire **NAVIGATE** → router / tab state
- [ ] **F4** — Wire **CHANGE_TO** → component variant state (carousel, toggle)
- [ ] **F5** — Wire **OVERLAY** → modal open/close
- [ ] **F6** — Loading / empty / error states if in PRD
- [ ] **F7** — **Animations** from inventory implemented (CSS transitions/keyframes); `prefers-reduced-motion` included

### G. Verify & document

- [ ] **G1** — Side-by-side: MCP screenshot vs running UI
- [ ] **G2** — **Colors** match Figma tokens / fills (no wrong hex)
- [ ] **G3** — **Position** — absolute elements align (backdrop, hotspots, floating buttons)
- [ ] **G4** — **z-index** — overlays/modals above content; controls clickable on top
- [ ] **G5** — All images/icons render from `assets/` paths
- [ ] **G6** — All prototype tree links for this page have matching behavior
- [ ] **G7** — Update `docs/figma-tree.md` only in design phase (verified node ids)
- [ ] **G8** — Lint/types/build pass for touched packages
- [ ] **G9** — Animations match Figma prototype (or documented as static)
- [ ] **G10** — Report: **Components / Images / Icons / Animations counts**, files created, assets paths, validation fixes, blockers

---

## MCP tool quick reference

```
whoami
get_metadata(fileKey, nodeId)
get_design_context(fileKey, nodeId)
get_screenshot(fileKey, nodeId)   ← export PNG for images/icons; visual verify
get_variable_defs(fileKey)
search_design_system(query)
use_figma          ← write only; load figma-use skill first
```

**Images & icons:** get **only from Figma MCP** — `get_screenshot(fileKey, nodeId)` + `get_design_context` URLs → `assets/images/`, `assets/icons/`. Never `upload_assets` (uploads into Figma). Never placeholders if Figma has the layer.

**URL parse:** `node-id=123-456` → `123:456` for API/MCP.

---

## Prototype tree API

```bash
curl -X POST http://localhost:4001/api/prototype-tree \
  -H "Content-Type: application/json" \
  -d '{
    "fileKey": "YOUR_FILE_KEY",
    "token": "YOUR_FIGMA_TOKEN",
    "nodeId": "123:456"
  }'
```

Expected sections in response:

- `[ENTRY] PageName` — start here for `get_design_context`
- `Tabs (NAVIGATE)` — screen-to-screen
- `CHANGE_TO` block — variant states (deduped destinations; label from prototype tree)
- `Overlays (MODALS)` — modal triggers

---

## Anti-patterns (MUST NOT)

- Build full page HTML before shared components exist (Button, Carousel, …)
- Ignore `CHANGE_TO` interactions (variant carousels, toggles)
- Create eight nav links for eight duplicate hotspots — dedupe by destination
- Fabricate node ids not verified by MCP
- Commit Figma tokens to client bundles
- **Guess colors** — always use `get_variable_defs` or exact MCP fill
- **Skip z-index** on backdrops, modals, control hotspots
- **Ignore absolute positioning** from Figma (backdrop layers, floating controls)
- Approximate spacing/colors instead of MCP exact values
- Skip images/icons because they are missing from `docs/figma-tree.md` — **find via MCP first**
- Use Figma CDN URLs in committed code instead of `assets/images/` / `assets/icons/`
- Use placeholder/stock images or icons when Figma MCP can export the real layer
- Ship components without running lint/types — fix or use context7 → web search until valid
- Ignore Figma `SMART_ANIMATE` / hover transitions when building modals, tabs, or carousels
- Add gratuitous animation not present in Figma or PRD

---

## Task complete — preview + forms

When **all** tree work is finished:

- **Preview:** run production preview and confirm health; if broken, fix (including **DB** when the API uses MySQL) until passing — `component-code-validation.md` § 5, `pre-work-requirements.mdc` § 6.
- **MySQL schema:** `db:status` + all expected tables in `{db_name}` before API route tests (`database-common-stack.mdc` § A).
- **Forms:** any screen with field validation **MUST** use **Formik + Yup** (`react-stack.mdc`).

---

## Related rules & skills

| Resource | Path |
|----------|------|
| **figma-tree index (read / ask)** | `.cursor/skills/figma-tree-todo/reference/figma-tree-index.md` |
| **figma-tree template (human only)** | `.cursor/skills/figma-tree-todo/reference/figma-tree-md-template.md` |
| Implementation rule | `.cursor/rules/figma-tree-implementation.mdc` |
| Structure checklist | `.cursor/rules/figma-tree-structure-checklist.mdc` |
| Design-to-code MCP | `.cursor/skills/figma-design/SKILL.md` |
| **Asset inventory (counts + export)** | `.cursor/skills/figma-tree-todo/reference/asset-inventory.md` |
| **Component code validation** | `.cursor/skills/figma-tree-todo/reference/component-code-validation.md` |
| **Animations (CSS)** | `.cursor/skills/figma-tree-todo/reference/animations-from-figma.md` |
| CSS / position / z-index | `.cursor/skills/figma-tree-todo/reference/css-from-figma.md` |
| Architecture §5 Figma | `.cursor/rules/architecture.mdc` |
