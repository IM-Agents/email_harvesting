# Figma asset inventory — components, images, icons

Use **before** writing page layout. Count everything on the target frame, then implement in order: **inventory → code components → export assets → compose page**.

## Images & icons — source is Figma MCP only (Required)

All **images** and **icons** in the codebase **MUST** come from the **Figma MCP server** for the target file — not from stock sites, guessed URLs, hand-drawn placeholders, or copied files outside Figma.

| Asset | Figma MCP tool | Save to |
|-------|----------------|---------|
| **Image** (photo, illustration, raster fill) | `get_screenshot(fileKey, nodeId)` **and/or** download URL from `get_design_context(fileKey, nodeId)` | `assets/images/{kebab-name}.png` (or `.webp` / `.jpg` per export) |
| **Icon** (vector, small mark, logo) | `get_design_context` (SVG/code if returned) **or** `get_screenshot(fileKey, nodeId)` at 2x | `assets/icons/{kebab-name}.svg` or `.png` |

**Per asset workflow (MUST):**

1. Inventory row has verified `fileKey` + `nodeId` from `get_metadata`
2. Call Figma MCP on that `nodeId`
3. Save binary/text output into project `assets/` folder
4. Import in React/webpack from local path (`import hero from '@/assets/images/hero.png'`)

**MUST NOT**

- Use `upload_assets` to download (it uploads **into** Figma)
- Use placeholder images/icons when the layer exists in Figma
- Leave hotlinked Figma CDN URLs in committed source — persist MCP export to disk first
- Skip MCP export because the layer was not listed in `docs/figma-tree.md` — find the `nodeId` first (§ 2)

## 1. Count checklist (MUST fill first)

After `get_metadata` on the **entry frame** (and each linked destination from the prototype tree), produce a summary table:

| Category | Count | Source | Notes |
|----------|------:|--------|-------|
| **Components** | _n_ | `COMPONENT`, `COMPONENT_SET`, `INSTANCE` in metadata | One code file per distinct component/set |
| **Images** | _n_ | `RECTANGLE` / frames with **image fills**, `IMAGE`-like exports, photos, illustrations | Raster assets → `assets/images/` |
| **Icons** | _n_ | Small `VECTOR` / icon components / SF-symbol-style nodes, logo marks | SVG or PNG → `assets/icons/` |

**Totals line (required in implementation notes):**

```text
Page: [Page Frame name] (nodeId: 123:456)
Components: 12 | Images: 5 | Icons: 8
```

- **MUST** record each row in the detailed inventory tables (§ 2–4) before creating files.
- **MUST** update counts when you discover nodes not listed in `docs/figma-tree.md`.

---

## 2. If not in `docs/figma-tree.md` — discover first (Required)

`docs/figma-tree.md` and the prototype-tree API list **screens and links**, not every asset.

| Situation | Action |
|-----------|--------|
| Component/image/icon **mentioned** in figma-tree | Verify `node-id` with `get_metadata`; add to inventory |
| **Not mentioned** in figma-tree | **MUST** find via MCP before coding — do not assume or skip |
| Unclear node type | `get_metadata(entryFrame)` → walk children; `get_design_context` on suspect nodes |

**Discovery order:**

1. `get_metadata(fileKey, entryFrameNodeId)` — full child tree, node names + ids
2. Compare against `docs/figma-tree.md` + prototype-tree markdown — list **gaps**
3. For each gap: `get_design_context` + `get_screenshot` to classify (component vs image vs icon)
4. Add every gap to the inventory tables with `nodeId`

---

## 3. Component inventory table

| # | Figma name | nodeId | Type | Variants | In figma-tree? | Code file | Reuse? |
|---|------------|--------|------|----------|----------------|-----------|--------|
| 1 | Button | 123:10 | COMPONENT | Primary, Ghost | yes | `components/ui/Button.tsx` | Create |
| 2 | … | | | | **no → found via metadata** | | |

---

## 4. Images inventory table

| # | Figma name | nodeId | Format | In figma-tree? | Local path |
|---|------------|--------|--------|----------------|------------|
| 1 | Hero Photo | 123:20 | PNG | no | `assets/images/hero-photo.png` |

**Export rules (Figma MCP → local file):**

- **MUST** export **only** via Figma MCP (`get_screenshot`, `get_design_context` asset URLs) — see top of this doc
- **MUST** save under project **assets** folder (adapt to stack):
  - `assets/images/` or `src/assets/images/` or `public/assets/images/` or `apps/web/src/assets/images/`
- **MUST** use kebab-case filenames from Figma layer name
- **`get_screenshot(fileKey, nodeId)`** — default for every image row (PNG)
- **`get_design_context(fileKey, nodeId)`** — when MCP returns downloadable image/SVG URL or inline asset reference, fetch and save beside screenshot export

---

## 5. Icons inventory table

| # | Figma name | nodeId | Format | In figma-tree? | Local path |
|---|------------|--------|--------|----------------|------------|
| 1 | Icon/Close | 123:30 | SVG or PNG | no | `assets/icons/icon-close.svg` |

- **MUST** export from Figma MCP — `get_design_context` first for SVG/icon code; else **`get_screenshot(fileKey, nodeId)`** at 2x → PNG
- Path: `assets/icons/` (or `src/assets/icons/`, `public/icons/`)
- Wire in code via local `import` — match project convention

---

## 6. Implementation order (MUST)

```
1. Count checklist (§ 1) — components | images | icons
2. Discover gaps not in figma-tree (§ 2)
3. Create **code components** from Figma MCP (get_design_context per component) — atoms → composites
4. **Get images + icons from Figma MCP** → save to `assets/images/`, `assets/icons/` (§ 4–5)
5. Compose page — import components + local asset paths only
6. CSS tokens, z-index, interactions (see css-from-figma.md)
```

- **MUST NOT** build the page frame before steps 1–4 are done for that page.
- **MUST NOT** skip icons/images because they were omitted from the prototype tree markdown.

---

## 7. MCP tools for this phase

| Tool | Use |
|------|-----|
| `get_metadata` | Count and list nodes; find gaps vs figma-tree |
| `get_design_context` | Component reference CSS/TSX; image URLs when returned |
| `get_screenshot` | Export PNG for images and icons |
| `search_design_system` | Reuse library components before creating new ones |
| `use_figma` | **Write** to Figma only — load `figma-use` skill first; not required for design-to-code export |

`upload_assets` uploads **into** Figma — do **not** use it to download assets to the codebase.
