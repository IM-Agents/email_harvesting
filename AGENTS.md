# AGENTS Operating Rules

This file defines baseline rules for all agents working in this repository.

## 1) Overview

All agents **MUST** load rules on every run — see **§ 3**. Parent agents **MUST** pass the rule list when spawning subagents.

## 2) Canonical Sources

- Active standards: `.cursor/rules/*.mdc`
- Workspace guide: `.cursor/README.md`
- Reusable workflows: `.cursor/skills/`
- Role prompts: `.cursor/agents/`

## 3) Rules on Every Agent Run (Required)

**Every** agent invocation — main session, subagent, or Task spawn — **MUST load and apply rules** before planning or code. Do not rely on memory; read the files.

### Baseline (every run)

| Step | Action |
|------|--------|
| 1 | Read this **`AGENTS.md`** |
| 2 | Read **`.cursor/rules/pre-work-requirements.mdc`** |
| 3 | Read **`README.md`** + **`docs/**`** (env, layout, stack) |
| 4 | Detect stack from README / `package.json` → load matching **`*-stack.mdc`** (see table below) |
| 5 | Load **task-specific** rules for the work (env, figma, DB, review, etc.) |

### Stack rules (load when detected)

| Stack / area | Rules |
|--------------|--------|
| Monorepo layout, preview, ports | `architecture.mdc`, `turbo-env-cache.mdc` |
| Env / config | `env-variables.mdc` |
| MySQL / shared DB | `database-common-stack.mdc`, `mysql-stack.mdc` |
| PostgreSQL | `database-common-stack.mdc`, `postgresql-stack.mdc` |
| MongoDB | `mongodb-stack.mdc` |
| React / UI | `react-stack.mdc`, `frontend.mdc`, `front-end-cursor-rules.mdc` |
| Node / API | `nodejs-stack.mdc`, `javascript-stack.mdc` |
| TypeScript | `typescript-stack.mdc` |
| Python | `python-stack.mdc` |
| PHP | `php-stack.mdc` |
| Flutter | `flutter-stack.mdc` |
| Electron | `electron-stack.mdc` |
| Shopify | `shopify-stack.mdc` |
| Figma / UI from design | `figma-tree-implementation.mdc`, `figma-tree-structure-checklist.mdc` |
| Planning / multi-step work | `planning.mdc` |
| Code review | `code-review-stack.mdc` |
| Tests | `testcase-generation-folder-structure.mdc` |
| Source conflicts | `source-precedence.mdc` |

When unsure, also read **`rules.mdc`** (index of all standards).

### When spawning subagents (Task / parallel agents)

Parent **MUST** pass in the subagent prompt:

1. **`AGENTS.md`** — follow § 3 (this section)
2. **Explicit rule list** — baseline + stack + task rules (paths under `.cursor/rules/`)
3. **Plan context** — `plan/plan-[name].md` and/or `plan/features/{slug}.md` when applicable
4. **Resolved paths** — `{frontend_app}`, `{backend_app}`, env names from README/docs

Example handoff line:

```text
Follow AGENTS.md § 3. Load: pre-work-requirements.mdc, planning.mdc, react-stack.mdc, env-variables.mdc.
Plan: plan/features/auth-login.md. {backend_app}=apps/api.
```

Subagents **MUST NOT** skip rules because the parent already read them — load again for the scoped task.

### Agent role files

Each file in **`.cursor/agents/*.md`** lists **additional** rules for that role. Role rules **add to** § 3 baseline; they do not replace stack or pre-work rules.

## 4) Rule Priority

Apply instructions in this order:

1. Direct user request
2. Repository rules in `.cursor/rules/`
3. This `AGENTS.md`
4. Do not create, auto-generate, or rewrite `docs/figma-tree.md` unless the user explicitly asks — read it when present; ask for it (or Figma URL + scope) when missing (`figma-tree-index.md`)
5. For the folder structure use for the our architecture skill and agnet.
6. Create .gitignore file root folder
7. First plan: `planning.mdc` — README + docs → think → `plan/plan-[name].md` + `plan/features/*.md` per feature when multi-feature
8. **App folder names** and **env var names** from `README.md` / `docs/` win over example paths (`apps/web`, `apps/api`); architecture **patterns** stay in `.cursor/rules/`. Do not move/rename app packages unless README or user requires it.

If rules conflict, follow the higher-priority source and document the decision.

## 5) Core Behavior Rules

- MUST load rules on **every run** — `AGENTS.md` § 3 (baseline + stack + task); pass rule list when spawning subagents.
- MUST identify the active stack before coding (JavaScript, React, Node.js, Flutter, Electron, MySQL, PostgreSQL, shared SQL).
- MUST apply matching stack rules from `.cursor/rules/`.
- MUST set env from README/docs; **plan `.md` = key only when docs have no value** (`Value` = `—`); `.env.example` at implement with comment — see `env-variables.mdc` § 2b.
- MUST register **new/additional** env through project `loadEnv` + config/`env.js` + `.env.example` — use **documented names only** (§ 2c), not invented keys.
- MUST keep changes small, reviewable, and reversible.
- MUST preserve security and performance constraints.
- MUST avoid hidden side effects and silent failure handling.
- MUST avoid unbounded async concurrency and unbounded database operations.
- SHOULD reuse existing patterns before introducing new abstractions.
- SHOULD add concise comments only when logic is not self-evident.

## 6) Change Workflow

1. **Pre-work gate** — read `README.md` + `docs/**` first (`pre-work-requirements.mdc`).
2. **Think** — synthesize what is needed from docs/README before any plan or code (`planning.mdc` § 1).
3. **Plan (if non-trivial)** — master `plan/plan-[name].md`; **feature chunks** `plan/features/{slug}.md` when 2+ features (`planning.mdc` § 2, 2b, 8).
4. **Subagents (if needed)** — parallel Task agents for independent plan tracks; **pass AGENTS.md § 3 rule list + plan chunk in each prompt**; parent merges results (`planning.mdc` § 3).
5. **Research** — context7 → web → **marketplace / MCP / skills / npm** (`planning.mdc` § 7a) → record in plan § Tools & marketplace.
6. **Implement** — from plan milestones using resolved `{frontend_app}` / `{backend_app}` paths.
7. Validate (tests/lint/checks).
8. Before manual `/code-review`, run CodeRabbit CLI from the current repo root inside the Docker task workspace (Linux bash only — never PowerShell/`Tee-Object`):
   - Confirm `.git` exists.
   - **Max wait: 30 minutes** (`CODERABBIT_REVIEW_MAX_WAIT_SEC=1800`). Cursor agent shell commands timeout around **90s** — do **not** run foreground `cr` in a single shell call.
   - Use the synced helper script (each step is a short shell call):
     1. `bash scripts/run-coderabbit-review.sh start`
     2. Poll every 30–60s: `bash scripts/run-coderabbit-review.sh status` until output contains `state=done` or `state=timeout` (do **not** start manual `/code-review` while `state=running`).
     3. `bash scripts/run-coderabbit-review.sh finalize`
   - On **`state=timeout`** (no complete CodeRabbit data after 30 min): save partial/timeout report, then **start manual `/code-review` anyway** — do not block the task.
   - Report path is printed as `final_report=reports/coderabbit/coderabbit-review-YYYYMMDD-HHMMSS.txt`.
   - Do not auto-fix CodeRabbit findings in this step; save the report only, then continue manual `/code-review`.
9. After manual `/code-review` is fully complete, save **one** manual review report for comparison:
   - Follow the auto-fix loop in `code-review-stack.mdc`: fix Blockers/Majors, re-review, repeat until zero Blockers and zero Majors remain (max 3 loops).
   - Do **not** save reports during intermediate auto-fix loops — only save after the final pass when review is clean (`✅ All clear — Approved`) or after the 3-loop limit (`⚠ Manual review needed`).
   - Create `reports/manual-code-review/` if missing.
   - Save only that **final** review response, including Summary, Findings, Verified, and Follow-ups, to `reports/manual-code-review/manual-code-review-YYYYMMDD-HHMMSS.txt`.
   - Add the generated report with `git add "reports/manual-code-review/manual-code-review-YYYYMMDD-HHMMSS.txt"`.
10. Summarize what changed, why, and any follow-up actions.

## 7) Quality Gates

Before finalizing:

- Confirm no contradiction with `.cursor/rules/*.mdc`.
- Confirm naming consistency and predictable structure.
- Confirm error handling is explicit.
- Confirm no obvious security regression.
- Confirm no obvious performance regression.

## 8) Communication Standard

- Be concise, clear, and action-oriented.
- State assumptions when context is missing.
- Report blockers immediately with concrete options.
- Prefer direct implementation over long speculative planning unless asked.
- DO NOT ask permission checks or approval prompts; proceed directly with implementation unless the user explicitly asks to pause.
