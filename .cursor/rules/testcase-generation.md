---
description: Test case generation — root test/, automation/ Playwright scripts, page-wise test/[page-name].md, README
alwaysApply: true
---

# Test Case Generation Rules

Always follow this flow when generating functional test cases. Use skill `.cursor/skills/testcase-generation/` for templates, coverage techniques, and TC format.

## Prerequisites — Do Not Start Until Work Is Done

**MUST NOT** create `test/` or any `test/[page-name].md` until implementation is complete and you have reviewed project documentation and code.

### Step 0 — Review before test cases (Required)

1. **Read root `README.md`** — project purpose, setup, scripts, architecture, API overview.
2. **Read `docs/`** — all relevant guides (`docs/*.md`, env guides, Docker docs, plans under `docs/superpowers/plans/` if present).
3. **Scan the codebase** — routes, pages, components, APIs, `package.json` scripts, env/config, existing `plan/` or `process.md` in the task folder.
4. **Confirm work is done** — features/pages from requirements are implemented; no open blockers; build/preview runs if applicable.
5. **Only then** begin the test-case creation flow below.

| Source | What to extract |
|--------|-----------------|
| `README.md` (root) | Stack, run commands, project structure |
| `docs/**` | Setup, env, deployment, feature specs |
| `apps/**`, `packages/**` | Real routes, pages, endpoints, UI flows |
| `plan/`, `process.md` | Scope, acceptance criteria, page list |

- **MUST** complete Steps 0.1–0.4 before creating `test/README.md` or page files.
- **MUST NOT** guess pages or features from memory — derive from README, docs, and code.
- If implementation is incomplete, **stop** and finish or document gaps; do not write full TC suites for missing work.

---

## Required Flow (After Prerequisites)

1. **Discover pages** — from codebase + docs (routes, Figma, requirements, navigation) after Step 0 review.
2. **Per page: inventory features** — forms, buttons, tables, modals, API calls, validations, workflows on that page.
3. **Create root `test/`** at project / monorepo root (sibling to `apps/`, `packages/`, `src/`).
4. **Create `test/README.md`** — index, page list, how to run automation; reference what you learned from root README + docs.
5. **Create one file per page:** `test/[page-name].md` — name from the **actual page** (route or screen title, kebab-case). Do not invent generic names; do not split one page across multiple files.
6. **Combined page file** — all features on the same page go in **one** `test/[page-name].md` (combined test case file).
7. **Write all TCs** for that page in that file (POS, NEG, EDGE, LOG).
8. **Update `test/README.md`** when adding a page file.
9. **Create root `automation/`** — all Playwright scripts, config, and specs (see [Automation folder](#automation-folder-playwright--required) below).
10. **Add `automation/` to root `.gitignore`** — generated Playwright work must not be committed with application code.

```
my-project/
├── apps/
├── packages/
├── test/ ← REQUIRED — markdown functional TCs
│   ├── README.md
│   ├── [page-name].md
│   └── ...
└── automation/ ← REQUIRED for Playwright — gitignored at repo root
    ├── playwright.config.js
    ├── package.json
    ├── functional_tests/
    │   └── [page-name].spec.js   ← one spec per test/[page-name].md
    └── logs/                     ← runtime reports (also under gitignored automation/)
```

**Naming `[page-name].md`:** derive from the real page only (e.g. route `/dashboard` → `dashboard.md`, screen title "Order Summary" → `order-summary.md`). Never use placeholder example names from docs as filenames.

- **MUST** organize test cases **page-wise** (one markdown file per page).
- **MUST** before writing: check the page and **combine** all features/widgets on that page into a single file.
- **MUST** use folder name `test/` for markdown TC docs.
- **MUST NOT** create separate files per widget/module if they belong to the same page.
- **MUST NOT** put markdown test cases in `docs/`, `plan/`, or app subfolders.
- **MUST NOT** put Playwright scripts in `tests/`, `apps/*/tests/`, or app source folders — use root `automation/` only.
- **MUST NOT** commit `automation/` — keep it in root `.gitignore`.

---

## `automation/` folder (Playwright — Required)

When implementing or generating Playwright automation (after `test/` markdown TCs exist), use a single root **`automation/`** folder at the project / monorepo root (sibling to `test/`).

### Scope

| Belongs in `automation/` | Does **not** belong here |
|--------------------------|---------------------------|
| `playwright.config.js` | Markdown TCs (`test/`) |
| `package.json` / lockfile for Playwright deps | Application `src/`, `apps/*` source |
| `*.spec.js`, `*.spec.ts`, page objects, fixtures | Vitest/Jest unit tests in `tests/` unless Playwright E2E |
| `functional_tests/` (or `testcases/`) spec trees | `docs/`, `plan/` |
| `logs/` (reports, last-run JSON) | Hardcoded project names/paths |

### Layout (align with QA runner)

Prefer this structure so backend QA can resolve specs:

```
automation/
├── package.json                  ← pinned @playwright/test 1.60.0 (must match QA server)
├── playwright.config.js          ← reporter: [["list"]] during generation; no trace/video unless required
├── functional_tests/
│   ├── [page-name].spec.js       ← maps to test/[page-name].md + TC IDs in describe/test titles
│   └── ...
└── logs/
    └── playwright-last-report.json   ← created when tests run (not during TC-only generation)
```

Alternative accepted by QA runner: `automation/testcases/` with specs under `functional_tests/` or `tests/`.

### `automation/package.json` (required — pinned version)

**MUST** pin `@playwright/test` to **`1.60.0`** (exact version, no `^` or `~`). This matches the QA runner server (`AI_QA_Automation`) and pre-installed Chromium.

```json
{
  "name": "<project>-automation",
  "private": true,
  "scripts": {
    "test": "playwright test"
  },
  "devDependencies": {
    "@playwright/test": "1.60.0"
  }
}
```

- **MUST NOT** use older versions (e.g. `1.49.x`) or floating ranges (`^1.60.0`).
- **MUST NOT** add a separate `playwright` package — `@playwright/test` is sufficient.

### Rules

- **MUST** create **all** Playwright-related files under `automation/` (config, specs, helpers, fixtures, page objects).
- **MUST** mirror page-wise markdown: one `automation/functional_tests/[page-name].spec.js` per `test/[page-name].md` where automation is in scope.
- **MUST** reference TC IDs (`TC-POS-001`, etc.) in spec titles or comments so failures map back to `test/`.
- **MUST** add `automation/` to the **root** `.gitignore` before or when creating the folder (create `.gitignore` at repo root if missing).
- **MUST NOT** modify frontend/backend application code when generating automation-only files.
- **MUST NOT** run `npm`/`npx`, start dev servers, or execute tests during markdown-only or generation-only steps unless the user explicitly asks to run them.

### Root `.gitignore` entry (required)

When `automation/` is created, ensure the project root `.gitignore` contains:

```gitignore
# Playwright automation (generated locally for QA; do not commit)
automation/
```

- **MUST** use the line `automation/` (trailing slash = entire directory).
- **MUST NOT** remove or override this entry to force-commit Playwright artifacts.

### `test/README.md` — automation section

In **How to run**, document both:

- Markdown review: `test/`
- Playwright (from repo root): `cd automation && npx playwright test` (or project script if defined)
- Note that `automation/` is gitignored and generated for local/QA runs

---

## `test/README.md` (Required)

Every project with generated test cases **MUST** include `test/README.md` containing:

| Section | Content |
|---|---|
| **Overview** | What the project tests cover |
| **Pages covered** | Table: File \| Page / route \| Features on page \| TC count \| Status |
| **How to run** | Markdown under `test/`; Playwright under `automation/` (`cd automation && npx playwright test`) |
| **Coverage map** | Links to each `test/[page-name].md` with page + combined features listed |
| **Conventions** | TC ID pattern `TC-POS-001`, categories POS/NEG/EDGE/LOG |

```markdown
# Test Cases Index

## Pages

| File | Page / route | Features combined on page | Categories |
|------|--------------|----------------------------|------------|
| [[page-name].md](./[page-name].md) | `/route` | [list features] | POS, NEG, EDGE, LOG |

## How to run

- Markdown review: open files under `test/`
- Playwright E2E: `cd automation && npx playwright test` (folder is gitignored; generate specs from `test/README.md`)
```

---

## Page discovery & combined features (Required)

Before creating any `test/[page-name].md`:

1. **Identify the page** — route, screen name, or Figma frame.
2. **List all features on that page** — e.g. header nav, login form, footer links, modal, table filters (same page = same file).
3. **Decide file scope** — one page → one `test/[page-name].md`; include every feature in that file under sections if needed.
4. **Cross-page flows** — only create a separate file when the workflow spans pages; label metadata with start/end pages and reference page files.

| Situation | Action |
|---|---|
| Login form + "Forgot password" link on `/login` | Single `test/login.md` with TCs for form + link |
| Dashboard with chart, table, export button | Single `test/dashboard.md` — all widgets combined |
| Checkout step 1 vs step 2 (different routes) | `test/checkout-step-1.md` and `test/checkout-step-2.md` (page-wise) |
| API-only (no UI page) | One file per API resource or route group, named after that endpoint group |

---

## `test/[page-name].md` (Required per page)

- **One file per page** — filename = actual page name (kebab-case from route or screen).
- **All features on that page** in the same file (combined test case file).
- **5–10+ TCs per category** per page where scope allows.
- Follow skill template: Metadata → Positive → Negative → Edge → Logical → footer.

### File structure

```markdown
# Functional Test Cases: [Page Title]

## Metadata
- **Page / route:** [/path or screen name]
- **Features on this page:** [bulleted list of everything tested in this file]
- **Source:** [requirement / ticket / plan link]
- **Stack:** [React, REST, Playwright, etc.]
- **File:** test/[page-name].md
- **Coverage:** [TC IDs covered]

---

## Positive Test Cases
### TC-POS-001: ...
### TC-POS-002: ...

## Negative Test Cases
### TC-NEG-001: ...

## Edge Cases
### TC-EDGE-001: ...

## Logical Validation Cases
### TC-LOG-001: ...

---

_Generated using Cursor skill **testcase-generation** · **File:** `test/[page-name].md`_
```

### Per test case (required fields)

- **Type**, **Priority**, **Preconditions**, **Test data**, **Steps**, **Expected result**
- **Automation mapping** (Layer, Entry, Actions, Assertions) when automation is planned

### TC ID rules

| Prefix | Category |
|--------|----------|
| `TC-POS-` | Positive / happy path |
| `TC-NEG-` | Negative / errors |
| `TC-EDGE-` | Boundaries, limits, special values |
| `TC-LOG-` | Workflows, state, business rules |

Number sequentially per file: `001`, `002`, …

---

## Coverage Requirements

Before writing TCs, decompose the requirement (from skill):

1. Actors & permissions 
2. Inputs (valid, invalid, boundaries) 
3. Outputs & error paths 
4. State & workflows 
5. Integrations 
6. Non-functionals (if specified)

Generate **multiple cases per category** (not one example each):

- **POS:** 5–10+ where scope allows 
- **NEG:** 5–10+ 
- **EDGE:** 4–8+ 
- **LOG:** 4–8+ 

---

## Anti-Patterns

```text
❌ Creating test/ before reading README.md + docs + code
❌ Writing TCs while features still not implemented
❌ test/form.md + test/modal.md for same page (split by widget — combine per page)
❌ Generic names not from app (invented labels) (use real page/route name)
❌ test-cases/[page].md (wrong path — use root test/)
❌ apps/web/tests/[page].md (markdown TCs not in app folder)
❌ test/all-pages.md (one mega file — split page-wise)
❌ Missing test/README.md
❌ Only 1 TC per category per page
❌ Playwright specs in apps/web/tests/ or tests/ instead of root automation/
❌ Committing automation/ or omitting automation/ from .gitignore

✅ test/README.md + test/[actual-page-a].md + test/[actual-page-b].md
✅ automation/functional_tests/[page-name].spec.js aligned with test/[page-name].md
✅ Root .gitignore includes automation/
✅ Each page file lists all combined features in Metadata
```

## Mandatory Deep Coverage Layers (MUST FOLLOW)

Test cases MUST NOT be limited to UI only.

For every feature, include coverage for:

- **API Validation:** request/response, invalid inputs, status codes, auth/session
- **Business Logic:** calculations, rules, operator precedence, edge values
- **Backend Logic:** data save/update, session/history, duplicate prevention
- **Error Handling:** API failure, network issues, timeout, recovery
- **Accessibility:** keyboard flow, tab/focus, basic accessibility checks
- **Input Consistency:** keyboard vs button, copy/paste, rapid actions
- **System-Level:** end-to-end flow, refresh, session, data persistence

### Rule
Do not skip these layers even if feature is UI-based.

--

## Checklist

- [ ] Root `README.md` read; relevant `docs/**` reviewed; codebase scanned
- [ ] Implementation complete — test creation started only after all work is done
- [ ] All pages/routes discovered from docs + code (not guessed)
- [ ] Each page’s features inventoried and combined into one file
- [ ] Root `test/` folder exists at project root
- [ ] `test/README.md` lists every `test/[page-name].md` with route + features
- [ ] One `test/[page-name].md` per page (real name from app, not doc examples)
- [ ] All four categories (POS, NEG, EDGE, LOG) with multiple TCs per page
- [ ] Each TC has steps, expected result, and automation mapping when applicable
- [ ] Footer references `test/[page-name].md`
- [ ] Root `automation/` exists with Playwright config + page-wise specs
- [ ] Root `.gitignore` contains `automation/`
- [ ] `test/README.md` documents how to run Playwright from `automation/`

### Basic Coverage
- [ ] All pages are covered
- [ ] Each page has single combined file
- [ ] POS, NEG, EDGE, LOG categories included

### API Validation
- [ ] API request validation cases added
- [ ] Status code validation included

### Business / Logic Validation
- [ ] Core logic tested
- [ ] Edge values covered

### Backend Validation
- [ ] Data/state scenarios covered
- [ ] Duplicate request prevention tested

### Error Handling
- [ ] API failure scenarios covered
- [ ] Recovery after failure tested

### Accessibility
- [ ] Keyboard-only flow tested
- [ ] Focus/navigation tested

### Input Consistency
- [ ] Keyboard vs button consistency verified
- [ ] Rapid actions handled

### System-Level Validation
- [ ] End-to-end flow validated
- [ ] Data persistence verified

### Playwright automation (`automation/`)
- [ ] All Playwright files live under root `automation/` (not app `tests/`)
- [ ] Specs map to `test/[page-name].md` and TC IDs
- [ ] `automation/` listed in root `.gitignore`
- [ ] No application source changed for automation-only work

---

## Final Rule

❌ DO NOT finalize test cases if ANY checklist item is unchecked 
✅ Only mark complete when ALL layers are covered