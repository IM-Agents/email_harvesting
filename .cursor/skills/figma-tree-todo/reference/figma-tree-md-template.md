# Figma Navigation Tree — {App Name}

> **Human / design phase only** — optional template for `{monorepo}/docs/figma-tree.md`.  
> **Agents:** do **not** auto-create this file; read it when the project provides it.  
> See [figma-tree-index.md](./figma-tree-index.md).

**File Key:** `{fileKey}`  
**Prototype Base URL:** https://www.figma.com/design/{fileKey}  
**Entry node:** `{nodeId}` (section or frame)  
**Last verified:** `{YYYY-MM-DD}` (Figma MCP)

---

## Requirements (derived from this tree — update when scope changes)

| Field | Value |
|-------|--------|
| **Problem** | {What user problem this app/flow solves} |
| **Done when** | {Testable acceptance — routes live, prototype paths wired, preview health} |
| **In scope** | {Screens/states listed in Navigation Tree below} |
| **Out of scope** | {e.g. backend APIs unless listed; tablet/mobile Figma if code-only responsive} |
| **App routes** | See § App routes ↔ test files |

---

## Navigation Tree

<!-- Paste output from POST /api/prototype-tree, then add full figma.com URLs per line -->

```
[ENTRY] / → {ScreenName}
├── [SCREEN] {ScreenName} — Desktop   → https://www.figma.com/design/{fileKey}/...?node-id={id}
├── [NAVIGATE] Tab → {Destination}    → node-id={id}
├── [CHANGE_TO] {Variant flow}        → node-id={id}
└── [OVERLAY] {Modal name}            → node-id={id}
```

### Prototype summary

| Type | Count | Notes |
|------|-------|--------|
| Screens | | |
| NAVIGATE | | |
| CHANGE_TO | | |
| OVERLAY | | |
| Animations | | SMART_ANIMATE / hover — see animations-from-figma.md |

---

## Responsive note

<!-- When only Desktop (or one frame) exists: -->

- Primary frame: {Desktop link}
- Tablet / Mobile: **code-only** (`@media` 768px / mobile) unless links added below
- Touch targets ≥ 44px on mobile

<!-- Optional — add ONLY after MCP verify or agent creates frame -->

<!-- - [SCREEN] {Name} — Tablet → URL -->
<!-- - [SCREEN] {Name} — Mobile → URL -->

---

## App routes ↔ test files

| Route | Figma screen | node-id | Test file |
|-------|--------------|---------|-----------|
| `/` | {ScreenName} | `{id}` | `test/{page}.md` |
| `/example` | | | |

---

## MCP verification log

| node-id | get_metadata | get_screenshot | Notes |
|---------|--------------|----------------|-------|
| `{entry}` | ✅ | ✅ | Entry frame |

---

## Gaps / blockers

<!-- Items found in MCP but not in prototype-tree API — resolve before coding -->

- 
