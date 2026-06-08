---
name: standards-suite
description: Applies organizational coding standards for JavaScript (ES6+), TypeScript, React, Node.js, Python, PHP, Flutter, Electron, MySQL, PostgreSQL, MongoDB, and shared relational database practices. Use when onboarding developers, defining engineering conventions, generating code that must match org standards, or when the user mentions coding standards, best practices, performance, or architecture for these stacks.
---

# Coding Standards Suite (Technical Lead)

## Purpose

This suite defines **market-aligned** conventions for **performance, scalability, and maintainability**. Humans use it for onboarding; agents use it as **normative** guidance when generating or refactoring code.

## Skill map (load the right leaf skill)

| Area | Skill folder | Primary doc |
|------|--------------|-------------|
| Modern JavaScript (ES6+) | `javascript-advanced/` | [SKILL.md](javascript-advanced/SKILL.md) |
| TypeScript | `typescript/` | [SKILL.md](typescript/SKILL.md) |
| React | `react/` | [SKILL.md](react/SKILL.md) |
| Node.js (APIs, services) | `nodejs/` | [SKILL.md](nodejs/SKILL.md) |
| Python | `python/` | [SKILL.md](python/SKILL.md) |
| PHP | `php/` | [SKILL.md](php/SKILL.md) |
| Flutter / Dart | `flutter/` | [SKILL.md](flutter/SKILL.md) |
| Electron | `electron/` | [SKILL.md](electron/SKILL.md) |
| MySQL | `mysql/` | [SKILL.md](mysql/SKILL.md) |
| PostgreSQL | `postgresql/` | [SKILL.md](postgresql/SKILL.md) |
| MongoDB | `mongodb/` | [SKILL.md](mongodb/SKILL.md) |
| Shared relational DB rules | `database-common/` | [SKILL.md](database-common/SKILL.md) |
| IM_coder_agent repo layout | `architecture/` | [SKILL.md](architecture/SKILL.md) |
| Figma page-wise todo | `figma-tree-todo/` | [SKILL.md](figma-tree-todo/SKILL.md) |
| Figma design-to-code MCP | `figma-design/` | [SKILL.md](figma-design/SKILL.md) |
| Code review workflow | `code-review/` | [SKILL.md](code-review/SKILL.md) |

## Reference layout

Most skill folders have a `reference/README.md` (singular) as the entry point — concise layout notes, examples, and stack-relevant guardrails. **Exception:** `architecture/` uses a plural `references/` folder; its README ([architecture/references/README.md](architecture/references/README.md)) maps each scenario (React/Node, TS, JS, multi-language) to a dedicated file.

| Stack | Reference |
|--------|-----------|
| JavaScript | [javascript-advanced/reference/README.md](javascript-advanced/reference/README.md) |
| TypeScript | [typescript/reference/README.md](typescript/reference/README.md) |
| React | [react/reference/README.md](react/reference/README.md) |
| Node.js | [nodejs/reference/README.md](nodejs/reference/README.md) |
| Python | [python/reference/README.md](python/reference/README.md) |
| PHP | [php/reference/README.md](php/reference/README.md) |
| Flutter | [flutter/reference/README.md](flutter/reference/README.md) |
| Electron | [electron/reference/README.md](electron/reference/README.md) |
| MySQL | [mysql/reference/README.md](mysql/reference/README.md) |
| PostgreSQL | [postgresql/reference/README.md](postgresql/reference/README.md) |
| MongoDB | [mongodb/reference/README.md](mongodb/reference/README.md) |
| Relational (common) | [database-common/reference/README.md](database-common/reference/README.md) |
| Code review | [code-review/reference/README.md](code-review/reference/README.md) |
| Architecture (Turborepo) | [architecture/references/README.md](architecture/references/README.md) |

## Agent workflow

1. Identify stack (JS/TS/React/Node/Python/PHP/Flutter/Electron/DB). For **IM_coder_agent** (`app/backend`, `app/frontend`), read [architecture/SKILL.md](architecture/SKILL.md) first.
2. Read the matching **leaf** `SKILL.md` first.
3. Pull that stack’s **`reference/README.md`** when examples or repo layout detail is needed.
4. Prefer **explicit error handling**, **bounded async**, **measurable performance** assumptions, and **consistent naming** across layers.
5. **Node.js** and **React** work always includes the matching **JavaScript** or **TypeScript** leaf skill and rule (`.js` → `javascript-advanced`, `.ts`/`.tsx` → `typescript`).

## Canonical filenames (legacy aliases)

These names map to the same standards as the skill folders:

- `javascript-standards.md` → `javascript-advanced/SKILL.md`
- `typescript-standards.md` → `typescript/SKILL.md`
- `react-standards.md` → `react/SKILL.md`
- `nodejs-standards.md` → `nodejs/SKILL.md`
- `python-standards.md` → `python/SKILL.md`
- `php-standards.md` → `php/SKILL.md`
- `flutter-standards.md` → `flutter/SKILL.md`
- `electron-standards.md` → `electron/SKILL.md`
- `mysql-standards.md` → `mysql/SKILL.md`
- `postgresql-standards.md` → `postgresql/SKILL.md`
- `mongodb-standards.md` → `mongodb/SKILL.md`
- `database-common-standards.md` → `database-common/SKILL.md`
- `code-review-standards.md` → `code-review/SKILL.md`
- `architecture-standards.md` → `architecture/SKILL.md`
