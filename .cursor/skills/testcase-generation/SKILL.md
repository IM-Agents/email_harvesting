---
name: testcase-generation
description: >-
  Generate comprehensive automation-ready functional test cases (Positive, Negative, Edge, Logical) as Markdown. AI owns implementation and execution—no manual QA. Works for UI, API, CLI.
---

# Functional Test Case Generation

## Purpose

Generate clean, executable test cases in Markdown with **maximum coverage**:
- Every distinct outcome, rule, input class, and integration point → at least one TC
- Shape for **AI automation**, not manual execution
- Output ready to save as `.md` or implement as tests immediately

---
**Updated Multiple Cases Per Type (Not Just One Example)**

**Before:** Showed only 1 example per type (TC-POS-001, TC-NEG-001, etc.)

**After:** Now generates **5-10+ cases per type**:
- **POS:** 5-10+ cases (all happy paths, valid variations)
- **NEG:** 5-10+ cases (all error types, invalid inputs)
- **EDGE:** 4-8+ cases (boundaries, limits, special values)
- **LOG:** 4-8+ cases (workflows, state transitions)


## Coverage Approach

**Before writing TCs, decompose the requirement:**

1. **Actors & permissions** → role-based scenarios
2. **Inputs** → valid classes, invalid classes, boundaries
3. **Outputs & errors** → each success/failure path
4. **State & workflows** → create/read/update/delete, ordering, idempotency
5. **Integrations** → external services, webhooks, timeouts
6. **Non-functionals** → performance, localization (if mentioned)

**Techniques:**
- **Equivalence partitioning:** Group inputs that behave the same
- **Boundary analysis:** Min, max, empty, whitespace
- **Negative matrix:** Invalid auth, malformed data, conflicts, not-found
- **Decision tables:** Each business rule → explicit TC
- **Workflows:** Multi-step states and transitions

---

## Markdown Template (Per Test Case)

```markdown
### TC-[POS|NEG|EDGE|LOG]-XXX: [Title]

**Type:** Functional | UI | API | Business Logic  
**Priority:** High | Medium | Low  
**Preconditions:**
- [Machine-setup / data / state]

**Test data:**
- `key`: value

**Steps:**
1. [Atomic action]
2. [Atomic action]

**Expected result:**
- [Assertable outcome 1]
- [Assertable outcome 2]

## Output Structure

```markdown
# Functional Test Cases

## Metadata
- **Source:** [requirement]
- **Stack:** [inferred: React, REST, Playwright]
- **Coverage:** [brief areas covered → TC IDs]

## Positive Test Cases
[TC-POS-001, TC-POS-002, ...]

## Negative Test Cases
[TC-NEG-001, TC-NEG-002, ...]

## Edge Cases
[TC-EDGE-001, TC-EDGE-002, ...]

## Logical Validation Cases
[TC-LOG-001, TC-LOG-002, ...]
```

**Footer (required):**
```markdown
---

_Generated using Cursor skill **testcase-generation** · **File:** `name.md`_
```

## Usage

1. Provide requirement text
2. AI generates Markdown with all four categories
3. **If full automation requested:** AI implements and runs tests immediately
4. **If Markdown-only:** Return `.md` file ready to save

**No manual QA execution—AI owns end-to-end.**

---
