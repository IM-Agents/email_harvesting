# Feature chunk — `plan/features/{feature-slug}.md`

> One **feature** = one understandable slice of work (screen, API module, migration batch, integration).  
> Master index: `plan/plan-[name].md` links here.

---

## Feature: {Human-readable name}

**Slug:** `{feature-slug}`  
**Status:** planned | in_progress | done  
**Depends on:** {other feature slugs or "none"}

---

## Thinking (why this chunk exists)

<!-- Short reasoning from README/docs — what problem this feature solves alone -->

- **From README/docs:** …
- **User ask:** …
- **Out of scope for this chunk:** …

---

## Requirements (this feature only)

| Field | Value |
|-------|--------|
| **Done when** | Testable acceptance for *this* feature |
| **Routes / APIs** | … |
| **UI / Figma** | node-id or screen name |
| **DB** | tables/migrations if any |
| **Env vars** | **Key from docs**; Value only if README/docs give one — else `—` in plan `.md` + Purpose; wire `.env.example` at implement (§ 2c) |

---

## Technology & rules

| Tech | Stack rule / skill |
|------|-------------------|

---

## Research (this feature)

- {topic}: context7 / web — conclusion

## Tools & marketplace (this feature)

| Need | Tool / MCP / skill / package | Source | Action |
|------|------------------------------|--------|--------|
| … | … | Cursor MCP / npm / `.cursor/skills/` | use / install / enable |

<!-- Check: Cursor marketplace, MCP, project skills, npm — before custom code -->

---

## Implementation steps

1. …
2. …

---

## Verification (this feature)

- [ ] lint / types for touched files
- [ ] manual or API check: …
- [ ] links to preview health if full-stack slice

---

## Notes / open questions

- …
