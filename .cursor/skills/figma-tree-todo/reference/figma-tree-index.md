# `docs/figma-tree.md` — read when present, ask when missing

**Canonical path:** `{monorepo}/docs/figma-tree.md`  
**Optional human template:** [figma-tree-md-template.md](./figma-tree-md-template.md) (for designers — **agents do not auto-create the file**)  
**Conventions:** `.cursor/rules/figma-tree-structure-checklist.mdc`, `architecture.mdc` § 5

---

## When this applies

Any UI / Figma work in `{monorepo}` — pre-work gate, page implementation, or design phase.

---

## Step 0 — Check index (Required)

```bash
test -f docs/figma-tree.md && echo "exists" || echo "missing"
```

| State | Agent action |
|-------|----------------|
| **File exists** | **Read first** — use **Requirements**, Navigation Tree, routes, and verified `node-id` URLs as scope |
| **File missing** | **MUST NOT auto-create** `docs/figma-tree.md` — **ask the user** to provide the file, a Figma URL + scope, or written requirements; derive **Requirements summary** from user/README/PRD until the index exists |

- **MUST NOT** write or commit `docs/figma-tree.md` unless the **user explicitly asks** to create or update it (design phase / human-owned doc).
- **MUST NOT** invent screens, routes, or node IDs without `docs/figma-tree.md` or user-confirmed Figma links.
- **MUST NOT** use `.cursor/doc/figma-tree.md` — index lives at **`docs/figma-tree.md`** when provided.

---

## Derive requirements

### When `docs/figma-tree.md` exists

Produce **Requirements summary** (`pre-work-requirements.mdc` § 2) **from** the index + prototype tree output — not from guesses.

| From index | Requirements field |
|------------|-------------------|
| Navigation tree screens / states | **In scope** screens and flows |
| `[ENTRY]`, routes table | Frontend routes to implement |
| `CHANGE_TO` / `OVERLAY` / `NAVIGATE` | Interactions **Done when** criteria |
| Missing tablet/mobile links | Responsive note → out-of-scope in Figma, in-scope in CSS |
| Gaps vs MCP (`C0.5` in SKILL) | **Open questions** before code |

- **MUST** reference `docs/figma-tree.md` in the summary (“Source: docs/figma-tree.md § Navigation Tree”).

### When `docs/figma-tree.md` is missing

1. **Ask** user for: Figma `fileKey` + entry `nodeId`, screen list, or the index file itself.
2. Derive **Requirements summary** from **user reply**, `README.md`, PRD, or `POST /api/prototype-tree` output (in chat/summary only — **do not** save as `figma-tree.md`).
3. **Block** full page implementation until user provides the index **or** explicitly accepts implementing from a single Figma URL + stated scope.

---

## Prototype tree API (when no index)

Use for **discovery and requirements only** — not to auto-generate the doc file:

```bash
curl -X POST http://localhost:4001/api/prototype-tree \
  -H "Content-Type: application/json" \
  -d '{"fileKey":"{fileKey}","token":"{FIGMA_TOKEN}","nodeId":"{nodeId}"}'
```

- Use markdown output in the **Requirements summary** and implementation checklist.
- **MUST** verify frames with Figma MCP before coding.
- **MUST NOT** persist that output as `docs/figma-tree.md` unless the user asks.

---

## Who creates / updates the index

| Actor | Action |
|-------|--------|
| **Designer / user** | Creates or updates `docs/figma-tree.md` (template optional) |
| **Agent** | **Read only** during implementation; update **only** when user explicitly requests a design-doc edit |

---

## Path summary

| Path | Use |
|------|-----|
| `{monorepo}/docs/figma-tree.md` | **Canonical** design index when provided by project |
| `.cursor/doc/figma-tree.md` | **Deprecated** — do not use |
| Prototype API output | Requirements / nav discovery in session — not auto-saved to disk |
