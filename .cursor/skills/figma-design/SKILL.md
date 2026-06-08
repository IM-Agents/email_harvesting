---
name: figma-design
description: Translate Figma designs into production-ready React code with 1:1 visual fidelity. Use when implementing UI from Figma files, building components from designs, or extracting design tokens.
origin: custom
---

# Figma Design to Code

Workflow for implementing Figma designs as production-ready React + TypeScript components.

## When to Activate

- User shares a Figma URL (`figma.com/design/...`)
- Implementing a UI component from a design spec
- Extracting design tokens (colors, spacing, typography)
- Syncing Code Connect mappings between Figma and codebase
- **Page-wise implementation** — load `.cursor/skills/figma-tree-todo/SKILL.md` first (prototype tree → components → page)

## MCP Tools Available (Figma Plugin)

```
mcp__plugin_figma_figma__get_design_context   → Get component code + screenshot
mcp__plugin_figma_figma__get_screenshot       → Export PNG for images/icons + visual verify
mcp__plugin_figma_figma__get_metadata         → File/node info
mcp__plugin_figma_figma__get_variable_defs    → Design tokens (colors, spacing)
mcp__plugin_figma_figma__search_design_system → Search components in design system
mcp__plugin_figma_figma__whoami               → Verify Figma connection
```

## URL Parsing

Extract `fileKey` and `nodeId` from Figma URLs:

```
figma.com/design/:fileKey/:fileName?node-id=:nodeId
→ convert "-" to ":" in nodeId

figma.com/design/:fileKey/branch/:branchKey/:fileName
→ use branchKey as fileKey

figma.com/board/:fileKey/:fileName
→ FigJam file, use get_figjam
```


You are a Figma pixel-perfect design converter.

When user provides:
- Figma URL
- Frame ID
- Node ID

You must:
1. Extract layout and **position** (relative / absolute / fixed)
2. Extract spacing and **z-index stacking order**
3. Extract typography
4. Extract **colors from `get_variable_defs`** and node fills from `get_design_context`
5. Extract borders, shadows, opacity, border-radius
6. Convert to pixel perfect CSS / Tailwind / Polaris
7. Maintain exact spacing, sizes, and layer order
8. Do not approximate values

Always generate:
- structured JSON spec
- pixel-perfect CSS
- React component


## Page-wise order (MUST)

When implementing a **full page/screen**, do **not** start with the page frame:

0. **`docs/figma-tree.md`** — read if present; if missing → **ask user** (do not auto-create); derive **Requirements summary**
1. `POST /api/prototype-tree` — entry, tabs, `CHANGE_TO` variant flows, overlays; sync into index
2. **Count checklist** — `Components: N | Images: N | Icons: N` via `get_metadata`
3. **Find gaps** — if not in `docs/figma-tree.md`, discover nodes with MCP first
4. **Create component files** — `get_design_context` per component; **validate lint/types after each**; context7 then web search if code invalid
5. **Export assets from Figma MCP** — `get_screenshot` + `get_design_context` → `assets/images/`, `assets/icons/` (MCP only; no placeholders)
6. **Animation audit** — if Figma has transitions/hover motion → CSS (`transition` / `@keyframes`); see `animations-from-figma.md`
7. **Compose page** — components + local assets only
8. Wire prototype interactions + animations (`NAVIGATE`, `CHANGE_TO`, `OVERLAY`, hover)

Full checklist: `.cursor/skills/figma-tree-todo/SKILL.md` · asset inventory: `figma-tree-todo/reference/asset-inventory.md`

## Implementation Workflow

### Step 1 — Get the Design & CSS

```
get_variable_defs(fileKey, nodeId)   → colors, spacing, radius tokens
get_design_context(fileKey, nodeId)  → reference CSS + screenshot
get_metadata(fileKey, nodeId)        → x, y, width, height, layer order (z-index)
```

Returns: React/CSS reference, screenshot, design hints. **Adapt CSS to project stack** — do not guess colors or position.

**CSS reference:** `.cursor/skills/figma-tree-todo/reference/css-from-figma.md`

### Step 2 — Check Existing Components
Before writing new code:
- Search project for similar components: `Grep "component-name" src/`
- Check if design system already has it
- Reuse existing components where intent matches

### Step 3 — Adapt to Project Stack
The MCP returns React + Tailwind as a reference — adapt to this project:
- Use **Webpack + esbuild** (not Vite/Next.js imports)
- Use **TypeScript** with proper interfaces for props
- Use project's existing CSS/styling approach
- Map Figma tokens to project's design tokens/CSS variables

### Step 4 — Validate Visually & stacking

```
get_screenshot(fileKey, nodeId)
```

Compare screenshot to rendered component — check spacing, **colors**, typography, **overlays**, **z-index** (controls on top, modals above backdrop).

## Position & z-index (MUST)

| Figma signal | CSS |
|--------------|-----|
| Child with x/y inside frame | Parent `position: relative`; child `position: absolute`; exact `top`/`left` from MCP |
| Overlay / dim layer | `position: absolute; inset: 0; z-index: 10` (or from stack table) |
| Modal / popup | Above overlay — `z-index: 20` |
| Control hotspots / pager dots | Above content — explicit `z-index` + pointer cursor |
| Later sibling in Figma tree | Higher `z-index` |

Use `get_metadata` sibling order to build the stack table before writing CSS.

## Component Structure

```typescript
// Standard component from Figma spec
interface ButtonProps {
  label: string
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  onClick?: () => void
}

export function Button({ label, variant = 'primary', size = 'md', disabled, onClick }: ButtonProps) {
  return (
    <button
      className={`btn btn-${variant} btn-${size}`}
      disabled={disabled}
      onClick={onClick}
    >
      {label}
    </button>
  )
}
```

## Design Token & Color Extraction (MUST)

**Step 1 — Variables (preferred):**

```
get_variable_defs(fileKey, nodeId)
```

**Step 2 — Node fills** (when no variable bound): from `get_design_context` reference CSS.

Map Figma variables to CSS custom properties:

```css
/* From get_variable_defs — exact names/values */
:root {
  /* example shape — replace with exact MCP values */
  --color-primary: #1a1a1a;
  --color-text: #333333;
  --color-overlay: rgba(0, 0, 0, 0.5);
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --radius-md: 8px;
}
```

- **MUST NOT** hardcode colors when a Figma variable exists
- **MUST** call `get_variable_defs` on page frame and each major component

## Checklist

- [ ] Fetched **colors** with `get_variable_defs` + fills from `get_design_context`
- [ ] Fetched **CSS layout** with `get_design_context` per component
- [ ] Checked **position** (x/y) and **z-index** with `get_metadata`
- [ ] Checked project for existing matching components
- [ ] Props typed with TypeScript interface
- [ ] Design tokens mapped to CSS variables
- [ ] Overlays/modals/control hotspots have correct stacking
- [ ] **Images/icons** exported from Figma MCP (`get_screenshot` / `get_design_context`) into `assets/images/`, `assets/icons/`
- [ ] **Lint + types pass** on all new component/page files (context7 first, then web search if fixes unclear)
- [ ] **Animations** from Figma prototype implemented in CSS when `Animations: N > 0`
- [ ] Visual comparison done with `get_screenshot`
- [ ] Responsive behavior matches design
- [ ] Accessibility: aria labels, keyboard nav, focus states
- [ ] Component added to relevant index/exports

## Electron Considerations

For Electron desktop UI:
- Use `data-testid` attributes for Playwright E2E selectors
- Avoid `window.open()` — use Electron's `shell.openExternal()`
- IPC calls (`window.electronAPI.*`) stay in component, not in shared lib
- Test with Electron's DevTools for pixel-accurate comparison
