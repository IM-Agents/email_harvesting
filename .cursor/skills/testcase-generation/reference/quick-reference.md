# Testcase Generation: Quick Reference

## One-Minute Summary

1. **Read requirement** → understand inputs, outputs, rules
2. **Decompose** → actors, fields, errors, workflows
3. **Generate four categories:**
   - **Positive:** Happy paths, valid inputs
   - **Negative:** Invalid inputs, permission denied, not found
   - **Edge:** Boundaries, empties, max length, special chars
   - **Logical:** Multi-step workflows, state transitions, business rules
4. **Every TC:** Automation mapping (Layer, Entry, Actions, Assertions)
5. **Save:** `.md` file with footer

---

## Coverage Checklist

| Scenario | Example | TC Category |
|----------|---------|-------------|
| Valid input succeeds | Email + password correct | **Positive** |
| Wrong input fails | Invalid email format | **Negative** |
| Missing required field | Empty password | **Negative** |
| Empty string | `password = ""` | **Edge** |
| Max length boundary | 254-char email | **Edge** |
| Min length boundary | 1-char password | **Edge** |
| Special characters | `user+tag@example.com` | **Edge** |
| Auth denied | Wrong role/permission | **Negative** |
| Workflow sequence | Logout → login | **Logical** |
| Rate limiting | 5 failed attempts | **Logical** |
| Concurrent requests | Double-submit | **Edge** |
| State transition | Draft → published | **Logical** |

---

## TC ID Pattern

```
TC-[POS|NEG|EDGE|LOG]-XXX: Title

POS  = Positive (happy path)
NEG  = Negative (invalid, error)
EDGE = Edge (boundaries, empties)
LOG  = Logical (workflows, rules)
XXX  = Sequential number (001, 002, ...)
```

---

## Automation Mapping Template (3 min per TC)

```markdown
**Automation mapping:**
- **Layer:** [UI | API | CLI | Mixed]
- **Entry:** [URL path | endpoint + method | shell command]
- **Actions:** [High-level: fill field, POST /endpoint, click button]
- **Assertions:** [Assertable checks: status 200, text present, exitCode === 0]
```

### By Layer

| Layer | Entry | Actions | Assertions |
|-------|-------|---------|-----------|
| **UI** | `{BASE_URL}/login` | Click, fill, submit | Visible text, redirect, hidden element |
| **API** | `POST /api/users` | JSON body, headers | Status code, response JSON, DB state |
| **CLI** | `./cli login --email user@ex.com` | Command args, env vars | `exitCode`, stdout text, file created |

---

## Common Patterns

### 1. Form Validation
- **POS:** Valid input submits
- **NEG:** Empty field, invalid format, too long
- **EDGE:** Min/max length, special chars, unicode
- **LOG:** Required + optional combinations

### 2. API Endpoint
- **POS:** Valid payload returns 201/200
- **NEG:** Missing required field (400), auth fail (401), not found (404)
- **EDGE:** Empty body, null fields, max payload size
- **LOG:** Idempotency, concurrent writes, state consistency

### 3. Workflow / Multi-Step
- **POS:** Complete flow succeeds (e.g., login → view dashboard → logout)
- **NEG:** Incomplete steps, missing data, permissions
- **EDGE:** Step timeout, large data mid-flow
- **LOG:** State transitions, undo/cancel, replay

---

## Distinct vs. Duplicate

**Write separate TCs when:**
- Different validation rule triggered
- Different error message returned
- Different actor/permission level
- Different expected outcome

**Don't duplicate when:**
- Same rule, just different valid input (parameterize in automation, not separate TC)

---

## Preconditions: Machine Setup Only

✅ **Good:**
```
- User account with email `test@example.com` exists (seed data)
- API key in env var `API_KEY`
- Mock server running at localhost:3000
```

❌ **Avoid:**
```
- User already logged in (assume login TC passes; use beforeEach fixture)
- QA to manually set time to 3 PM (use date mocking)
```

---

## When Requirement is Ambiguous

**Document assumption in Preconditions:**
```
**Preconditions:**
- Assuming max password length = 128 (not stated; adjust if different)
- Assuming case-sensitive email (not stated)
```

Add optional TC for alternate interpretation:
```
### TC-NEG-004: [Assumption] Case-insensitive email login
**Note:** Included only if requirement clarifies email is case-insensitive.
```

---

## File Format

```markdown
# Functional Test Cases: [Feature]

## Metadata
- **Source:** [brief]
- **Stack:** [inferred]
- **Coverage:** [areas → TC IDs]

## Positive Test Cases
### TC-POS-001: ...
...

## Negative Test Cases
### TC-NEG-001: ...
...

## Edge Cases
### TC-EDGE-001: ...
...

## Logical Validation Cases
### TC-LOG-001: ...
...

---

_Generated using Cursor skill **testcase-generation** · **File:** `name.md`_
```

---

## Implementation Workflow (AI + User)

1. **User:** Provide requirement
2. **AI:** Generate Markdown TCs
3. **If full automation:** AI writes tests, runs suite, reports pass/fail by TC ID
4. **If Markdown-only:** Return `.md` ready to save; AI can implement later

**No manual QA—AI implements and executes.**
