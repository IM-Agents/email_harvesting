# CSS from Figma MCP — position, z-index, colors, layout

Use this reference when implementing components from Figma. **All values MUST come from MCP** — do not guess colors, spacing, or stacking order.

## MCP tools for CSS

| Tool | CSS / layout data |
|------|-------------------|
| `get_design_context` | Reference CSS (position, size, flex/grid, typography, fills, shadows, borders, opacity) |
| `get_metadata` | Node tree with **x, y, width, height** — use for position audit and z-order |
| `get_variable_defs` | **Color tokens**, spacing, radius variables bound to nodes |
| `get_screenshot` | Visual verify stacking, overlays, contrast |

Run **all four** per page frame and per overlay/variant frame before writing CSS.

---

## 1. Colors (MUST from Figma)

### Step A — Variables (preferred)

```
get_variable_defs(fileKey, nodeId)
```

Returns map like `{ "color/primary": "#1a1a1a", "text/default": "#333333" }` (exact values from MCP).

- **MUST** map every used variable to a CSS custom property in `tokens.css` / theme
- **MUST NOT** hardcode hex/rgb when a Figma variable is bound to that property
- **MUST** call `get_variable_defs` on page frame **and** each component node

```css
:root {
  /* from get_variable_defs — exact names sanitized; values from MCP only */
  --color-primary: #1a1a1a;
  --color-text-default: #333333;
  --color-bg-surface: #ffffff;
}
```

### Step B — Node fills (when no variable)

From `get_design_context` reference code:

- `background-color` / `background` — solid fills, gradients
- `color` — text fill
- `border-color` — stroke
- `box-shadow` — drop shadow (include spread, blur, offset)
- `opacity` — layer opacity

- **MUST** copy exact values from MCP output
- **MUST NOT** round or tweak hex values (e.g. `#1a1a1a` → `#1a1a1b`) without MCP proof

---

## 2. Position & layout (MUST check)

### From `get_metadata`

Each node includes position and size. Build a **layout spec table** before coding:

| Node name | x | y | width | height | Parent | Notes |
|-----------|---|---|-------|--------|--------|-------|
| Modal Backdrop | 0 | 0 | 1440 | 900 | Page Frame | full-bleed |
| Control Hotspot | 120 | 840 | 24 | 8 | Bottom Bar | absolute |

### Figma → CSS position rules

| Figma layout | CSS |
|--------------|-----|
| Auto-layout frame (vertical/horizontal) | `display: flex`; `flex-direction`; `gap`; `padding` from MCP |
| Child with constraints (left/top) | Parent `position: relative`; child `position: absolute`; `top`/`left`/`right`/`bottom` from MCP |
| Fixed overlay / modal backdrop | `position: fixed` or `absolute` + inset; full viewport |
| Centered child | `absolute` + `transform: translate(-50%, -50%)` or flex center — match MCP |
| Grid-like rows | Prefer flex from auto-layout; use CSS grid only if MCP shows grid |

- **MUST** set `position: relative` on the nearest positioned ancestor
- **MUST** match **exact px** for `top`, `left`, `width`, `height` from MCP (or `%` if MCP uses %)
- **MUST NOT** use margin hacks when Figma uses absolute positioning

---

## 3. z-index & stacking (MUST check)

Figma paints **later siblings on top**. Map layer order to `z-index`:

| Layer (bottom → top) | Role | Suggested z-index |
|----------------------|------|-------------------|
| Background / base frame | Page bg | `0` or `auto` |
| Content panels | Main UI | `1` |
| Control hotspots / pager dots | Controls | `2` |
| Dim backdrop rectangle | Dim layer | `10` |
| Modal / popup | Dialog | `20` |
| Tooltip / toast | Topmost | `30` |

Checklist:

- [ ] List all overlapping nodes from `get_metadata` (same x/y region, different names)
- [ ] Order siblings by Figma tree order (last = front)
- [ ] Assign explicit `z-index` when nodes overlap (overlays, controls, sticky nav)
- [ ] Overlay backdrop **below** modal content, **above** page content
- [ ] Verify with `get_screenshot` — nothing hidden behind wrong layer

```css
.modalBackdrop { position: absolute; inset: 0; z-index: 10; }
.contentLayer  { position: relative; z-index: 1; }
.controlHotspot { position: absolute; z-index: 2; cursor: pointer; }
```

---

## 4. Full CSS property checklist (from `get_design_context`)

Extract and apply **exact** values for each component:

| Category | Properties |
|----------|------------|
| **Box** | `width`, `height`, `min-width`, `max-width`, `padding`, `margin`, `gap` |
| **Position** | `position`, `top`, `right`, `bottom`, `left`, `inset`, `z-index` |
| **Flex/Grid** | `display`, `flex-direction`, `align-items`, `justify-content`, `flex-wrap`, `flex-grow` |
| **Typography** | `font-family`, `font-size`, `font-weight`, `line-height`, `letter-spacing`, `text-align`, `text-decoration` |
| **Color** | `color`, `background`, `border-color`, `fill` (SVG) |
| **Border** | `border-width`, `border-style`, `border-radius` (per-corner if different) |
| **Effects** | `box-shadow`, `opacity`, `filter` (blur), `backdrop-filter` |
| **Motion** | `transition`, `animation`, `@keyframes` — when Figma prototype has transitions; see [animations-from-figma.md](animations-from-figma.md) |
| **Overflow** | `overflow`, `clip-path` if present |

- **MUST** prefer CSS variables for colors from `get_variable_defs`
- **MUST** keep border-radius per corner when Figma corners differ
- **SHOULD** document gradient stops if MCP returns `linear-gradient(...)`

---

## 5. Design spec JSON (write before coding)

For each page/component, produce a short spec from MCP:

```json
{
  "nodeId": "123:456",
  "name": "Page Frame",
  "tokens": {
    "color/primary": "#000000",
    "spacing/md": "16px"
  },
  "stacking": [
    { "name": "Base Layer", "zIndex": 0 },
    { "name": "Content Group", "zIndex": 1 },
    { "name": "Modal Backdrop", "zIndex": 10 }
  ],
  "positionedNodes": [
    { "name": "Floating Badge", "position": "absolute", "top": "24px", "left": "16px", "zIndex": 2 }
  ]
}
```

Store in component folder as `{Component}.figma-spec.json` **optional** — or keep in implementation notes.

---

## 6. Anti-patterns

| ❌ Don't | ✅ Do |
|---------|------|
| Guess `#333` for text | `get_variable_defs` or exact fill from MCP |
| Ignore dim backdrop layer | Map backdrop node → `z-index` + `background` + `opacity` |
| Flatten control hotspots to static divs | Absolute position + click targets from metadata |
| Skip z-index on modals | Backdrop z-10, content z-20 |
| Approximate `14px` → `1rem` without check | Use exact px from MCP unless project mandates rem |
| One `get_design_context` for whole file | Per frame + per variant + per overlay |

---

## 7. Verification

- [ ] Every color traceable to `get_variable_defs` or `get_design_context`
- [ ] Overlapping layers have explicit z-index
- [ ] Absolute children have positioned parent
- [ ] Screenshot matches rendered page (spacing, colors, stacking)
- [ ] Interactive controls clickable and visually on top of content where designed
