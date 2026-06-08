# Stack map — skills + rules for code review

Reference for [../SKILL.md](../SKILL.md). For each distinct stack found in the diff, load **one** leaf skill + **one** matching rule. Do not load stacks for files not in the diff.

Master rule that applies to **every** file: `.cursor/rules/rules.mdc`

---

## Extension → stack lookup

| Changed files | Load leaf skill | Load cursor rule |
|---------------|-----------------|-----------------|
| `.js`, `.jsx`, `.mjs` | `javascript-advanced/SKILL.md` | `javascript-stack.mdc` |
| `.ts`, `.tsx` | `typescript/SKILL.md` | `typescript-stack.mdc` |
| `.jsx` (UI components) | `react/SKILL.md` **+ JS above** | `react-stack.mdc` **+ JS rule** |
| `.tsx` (UI components) | `react/SKILL.md` **+ TS above** | `react-stack.mdc` **+ TS rule** |
| `.js`, `.mjs` (API / server) | `nodejs/SKILL.md` **+ JS above** | `nodejs-stack.mdc` **+ JS rule** |
| `.py` | `python/SKILL.md` | `python-stack.mdc` |
| `.php` | `php/SKILL.md` | `php-stack.mdc` |
| `.dart` | `flutter/SKILL.md` | `flutter-stack.mdc` |
| `.sql` | `database-common/SKILL.md` + dialect skill | `database-common-stack.mdc` + dialect rule |
| `.html`, `.css`, `.scss` | — | `rules.mdc`; `front-end-cursor-rules.mdc` |
| `.json` | — | `rules.mdc`; `typescript-stack.mdc` for `tsconfig*.json` only |
| `.sh` | — | `rules.mdc` §Security + shell section |
| `.env`, `.env.*` | — | `rules.mdc` §Security only |
| `.xml` | — | `rules.mdc` §Security (Android/iOS manifest) |

**SQL dialect:** infer from repo (check `package.json` for `pg`/`mysql2`, or DB config files). Default to `mysql-stack.mdc` unless evidence of PostgreSQL.

---

## Extended stacks (out of default scope)

Only load these when the user explicitly expands the review scope.

| Files / area | Leaf skill | Cursor rule |
|--------------|------------|-------------|
| `.cjs` | `javascript-advanced/SKILL.md` | `javascript-stack.mdc` |
| Shopify app files | `shopify/SKILL.md` | `shopify-stack.mdc` |
| Electron app files | `electron/SKILL.md` | `electron-stack.mdc` |
| MongoDB (`.js`/`.ts` with Mongoose) | `mongodb/SKILL.md` | `mongodb-stack.mdc` |
| Architecture / system design | `architecture/skill.md` | — |
| Figma handoff / design tokens | — | `figma-tree-structure-checklist.mdc` |

---

## Cross-stack rules — apply when the condition matches

These are not "always check everything" rules — apply only when the matching condition is present in the PR.

| Rule | Apply when |
|------|-----------|
| Never `SELECT *` | Any `.sql`, ORM query in `.py`, `.php`, `.js`, `.ts` |
| Server-side authZ | New or changed HTTP handlers in `.js`, `.ts`, `.php` that handle create/update/delete/admin |
| No `any` / blind `as` | New or changed `.ts` / `.tsx` |
| JS leaf on Node/React | `.js`/`.jsx`/`.mjs` files inside a Node or React context |
| Secrets check | **Every PR** — scan all changed files regardless of extension |
| Empty catch | **Every PR** — scan all JS/TS/PHP/Python changed files |

---

## How to use this map

1. Open `code-review/SKILL.md` (the workflow)
2. Open `rules.mdc` (universal gates)
3. For **each distinct stack** in the diff (not each file — one load per stack type):  
   a. Open leaf `SKILL.md`  
   b. Open `*-stack.mdc`  
   c. Open `reference/README.md` only if you need detailed checklists
4. Review only changed lines against the loaded rules
5. Do not load stacks for file types not present in the diff

**Example:** PR changes `api/orders.ts` and `queries/orders.sql`  
→ Load: `typescript/SKILL.md` + `typescript-stack.mdc` + `nodejs/SKILL.md` + `nodejs-stack.mdc` + `database-common/SKILL.md` + `mysql-stack.mdc`  
→ Do NOT load: `react-stack.mdc`, `flutter-stack.mdc`, `python-stack.mdc`

---

## Reference index

| Resource | Location |
|----------|----------|
| Review workflow | `code-review/SKILL.md` |
| PR checklists | `code-review/reference/README.md` |
| Finding examples | `code-review/reference/examples.md` |
| This map | `code-review/reference/stack-map.md` |
| Master rules | `.cursor/rules/rules.mdc` |
| Review cursor rule | `.cursor/rules/code-review-stack.mdc` |
| Skills suite index | `.cursor/skills/SKILL.md` |
