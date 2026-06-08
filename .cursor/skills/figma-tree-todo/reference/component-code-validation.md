# Component code validation — after each Figma → code component

**MUST** validate every new or updated component file **immediately after** implementing it from Figma MCP — before the next component, before asset export, and before composing the page.

## 1. Validate (run after each component)

Use the project’s real checks (read root / app `package.json` scripts):

| Check | Typical command | Pass criteria |
|-------|-----------------|---------------|
| IDE / linter | Editor diagnostics on changed files | No errors on touched `.tsx` / `.jsx` / `.css` |
| Lint | `npm run lint` or `turbo run lint --filter=web` | Exit 0 |
| Types | `npx tsc --noEmit` or `turbo run check-types` | No type errors in changed package |
| Build (if fast) | `npm run build` or `turbo run build --filter=web` | Compiles without error |

- **MUST** fix **syntax**, **import**, **type**, and **CSS module** errors before continuing.
- **MUST** re-run the same check after each fix until it passes for that component.
- **SHOULD** run lint/types again after composing the **page** file (imports may surface new errors).

## 2. If code is not valid — fix order

```
1. Read error message + file/line
2. Fix using project patterns (grep similar components, existing hooks, stack rules)
3. Re-run lint / tsc
4. Still failing? → context7 MCP first (official docs: React, webpack, CSS modules, TypeScript, etc.)
5. Still failing? → Web search (exact error + library name + version)
6. Apply fix → re-validate → only then continue checklist
```

**context7 MCP (first — when local fix is unclear)**

- **MUST** query **context7** before web search for library/API errors.
- Look up the failing API, config option, or pattern for the project stack (e.g. `css-loader` `namedExport`, React 18 types, webpack 5 `publicPath`).
- Apply fixes that match the version in `package.json`.

**Web search (second — if context7 did not resolve it)**

- Query with **exact** compiler/linter text (e.g. `TS2322`, `Module not found`).
- Include **stack** from project (`React 18`, `webpack 5`, `TypeScript 5`, CSS Modules).
- Prefer solutions that match this repo’s config — do not paste unrelated CRA/Vite fixes blindly.

**MUST NOT**

- Skip validation and stack many components with broken code
- Mark the page done while lint/build still fails
- Copy invalid MCP reference code without adapting imports/paths to the project
- Run **web search** before **context7** when debugging library/API errors

## 3. Per-component checklist (attach to § D in SKILL)

- [ ] Component file(s) created from `get_design_context`
- [ ] Linter clean on changed paths
- [ ] `lint` / `tsc` (or project equivalent) passes for this package
- [ ] Visual spot-check vs `get_screenshot` (optional if build is slow)
- [ ] If errors remained: context7 then web search used and documented in summary

## 4. Page-level gate

Before **§ F Compose page**:

- [ ] All components in inventory pass § 1 checks
- [ ] Page file + route compile
- [ ] Forms with validation use **Formik + Yup** (`react-stack.mdc`)
- [ ] Full-package `lint` + `build` (or `turbo run build`) passes when the task touches the app

## 5. Task-done preview (after all pages/components)

When **all** Figma-tree work is complete:

- [ ] Run `PUBLIC_PATH='/qa/{root folder name}' NODE_ENV=production npm run preview`
- [ ] Local + public health URLs pass (`pre-work-requirements.mdc` § 6, `architecture.mdc` § 4.3)
- [ ] If preview fails: fix build/proxy paths; if MySQL backend — verify `{db_name}`, `db:migrate` / `db:init`, corrupt schema (`database-common-stack.mdc`)
- [ ] **MySQL:** `db:status` clean; all expected **tables** in `{db_name}`; all DB-backed API routes tested; failures fixed and re-tested before done
- [ ] `preview:stop` after success; report health URLs in summary
