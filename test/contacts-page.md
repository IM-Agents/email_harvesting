# Functional Test Cases — Contacts Page

## Metadata
- **Source:** `docs/frontend-requirements.md` (Contacts Results), `docs/api-endpoints.md` (GET `/batches/{id}/contacts`, query filters)
- **Stack:** React 18 SPA, REST `/api/v1`, Playwright automation
- **Route:** `/contacts`
- **API base:** `/api/v1`
- **Filters:** domain, source, priority_level, job title, has_email
- **Coverage:** Table display, filtering, pagination, export links — TC-POS-001–006, TC-NEG-001–005, TC-EDGE-001–004, TC-LOG-001–004

## Positive Test Cases

### TC-POS-001: Contacts page loads table with required columns

**Type:** UI | API  
**Priority:** High  
**Preconditions:**
- Logged in as `admin@emailharvest.local` / `admin123`
- System has discovered contacts across batches

**Test data:**
- Auth: default admin

**Steps:**
1. Navigate to `/contacts`
2. Wait for contacts data load

**Expected result:**
- Table columns visible: store_url, domain, company_name, email, contact_name, job_title, source, priority_level, discovered_at
- At least one row when data exists
- Pagination controls if result set exceeds page size

### TC-POS-002: Filter contacts by domain

**Type:** UI | API  
**Priority:** High  
**Preconditions:**
- Contacts exist for `example.com` and other domains

**Test data:**
- Filter `domain`: `example.com`

**Steps:**
1. Open `/contacts`
2. Enter or select domain filter `example.com`
3. Apply filter

**Expected result:**
- GET request includes `domain=example.com` (or equivalent)
- All visible rows have domain matching filter (normalized)
- Row count ≤ unfiltered total

### TC-POS-003: Filter contacts by source

**Type:** UI | API  
**Priority:** High  
**Preconditions:**
- Contacts from multiple sources (snov, apollo, linkedin, website)

**Test data:**
- Filter `source`: `apollo`

**Steps:**
1. Set source filter to Apollo
2. Apply

**Expected result:**
- Only Apollo-sourced contacts displayed
- Source column consistently shows `apollo` (or display label)

### TC-POS-004: Filter contacts where has_email is true

**Type:** UI | API  
**Priority:** High  
**Preconditions:**
- Mix of contacts with and without email addresses

**Test data:**
- Filter `has_email`: `true`

**Steps:**
1. Enable has_email filter on `/contacts`
2. Apply filter

**Expected result:**
- All rows have non-empty email field
- Contacts without email hidden from results

### TC-POS-005: Combine domain and source filters

**Type:** UI | API  
**Priority:** Medium  
**Preconditions:**
- Sufficient contact diversity

**Test data:**
- `domain`: `shopify-store.com`
- `source`: `snov`

**Steps:**
1. Apply domain filter
2. Apply source filter simultaneously

**Expected result:**
- Results match both criteria (AND logic)
- API query includes both parameters

### TC-POS-006: Paginate contacts list

**Type:** UI | API  
**Priority:** Medium  
**Preconditions:**
- More contacts than default page size (e.g., > 25)

**Test data:**
- `page`: 2, `limit`: 25

**Steps:**
1. Load `/contacts`
2. Navigate to page 2

**Expected result:**
- Different rows than page 1
- GET includes `page=2&limit=25`
- Total count indicator accurate

## Negative Test Cases

### TC-NEG-001: Unauthenticated access to contacts page

**Type:** UI | Security  
**Priority:** High  
**Preconditions:**
- No auth session

**Test data:**
- None

**Steps:**
1. Navigate to `/contacts`

**Expected result:**
- Redirect to `/login`
- No contact PII in page source

### TC-NEG-002: Filter by domain with no matching contacts

**Type:** UI  
**Priority:** Medium  
**Preconditions:**
- Logged in

**Test data:**
- `domain`: `nonexistent-domain-xyz.test`

**Steps:**
1. Apply domain filter with no matches

**Expected result:**
- Empty state message (no contacts found)
- Table shows zero rows, not error crash

### TC-NEG-003: Invalid source filter value

**Type:** UI | API | Validation  
**Priority:** Medium  
**Preconditions:**
- Logged in

**Test data:**
- `source`: `invalid_source_name`

**Steps:**
1. Enter invalid source in filter (if free text) or manipulate query string

**Expected result:**
- Validation error or empty results with clear message
- API returns 400 or empty set per spec — no 500

### TC-NEG-004: Contacts API failure

**Type:** UI | API  
**Priority:** High  
**Preconditions:**
- Simulate GET contacts failure

**Test data:**
- Network/API 500

**Steps:**
1. Load `/contacts` under failure

**Expected result:**
- Error state with retry
- No stale cached contact data presented as current

### TC-NEG-005: has_email=false filter shows contacts without email

**Type:** UI | API  
**Priority:** Medium  
**Preconditions:**
- Contacts without email exist

**Test data:**
- `has_email`: `false`

**Steps:**
1. Apply has_email false filter if supported

**Expected result:**
- Rows shown have empty/null email OR filter disabled with documented behavior
- No rows with populated email if filter semantics require absence

## Edge Cases

### TC-EDGE-001: Filter special characters in domain field

**Type:** UI | Validation  
**Priority:** Medium  
**Preconditions:**
- Logged in

**Test data:**
- Domain search: `test'; DROP TABLE--`

**Steps:**
1. Enter malicious domain filter string
2. Apply filter

**Expected result:**
- Parameterized API query; no SQL injection
- Safe empty result or validation error

### TC-EDGE-002: Very large contact result set performance

**Type:** UI | Performance  
**Priority:** Medium  
**Preconditions:**
- 10,000+ contacts in database

**Test data:**
- Unfiltered list

**Steps:**
1. Load `/contacts` first page
2. Measure render time

**Expected result:**
- Page loads with pagination; not all rows rendered at once
- Acceptable LCP on dev hardware

### TC-EDGE-003: Contacts with unicode names and emails

**Type:** UI  
**Priority:** Low  
**Preconditions:**
- Contact with unicode in name/email local part if valid

**Test data:**
- Unicode contact_name

**Steps:**
1. Locate contact in table

**Expected result:**
- Characters render correctly without mojibake
- Sorting/filtering does not break

### TC-EDGE-004: Clear all filters restores full list

**Type:** UI  
**Priority:** Medium  
**Preconditions:**
- Filters currently applied

**Test data:**
- Active domain + source filters

**Steps:**
1. Click Clear filters / reset
2. Observe table

**Expected result:**
- All filters reset to default
- Full contact list (page 1) restored
- URL query params cleared if used

## Logical Validation Cases

### TC-LOG-001: Contact row links to correct domain detail

**Type:** Business Logic  
**Priority:** High  
**Preconditions:**
- Contact row with domain link

**Test data:**
- Known contact with domainId

**Steps:**
1. Click domain or row action from contacts table
2. Verify navigation target

**Expected result:**
- Navigates to `/domains/:domainId` for that contact's domain
- Domain detail matches contact domain field

### TC-LOG-002: Filter results consistent with batch-scoped contacts API

**Type:** Business Logic  
**Priority:** High  
**Preconditions:**
- Known batch with contacts

**Test data:**
- `batchId`, domain filter

**Steps:**
1. GET `/api/v1/batches/{batchId}/contacts?domain=X`
2. Apply same domain filter on global `/contacts` page
3. Compare overlapping records

**Expected result:**
- Global page includes batch contacts matching filter
- No contradictory email/domain pairs between views

### TC-LOG-003: priority_level filter orders executive contacts first in sorted view

**Type:** Business Logic  
**Priority:** Medium  
**Preconditions:**
- Sort by priority if UI supports

**Test data:**
- Mixed priority levels

**Steps:**
1. Apply sort or filter for executive priority
2. Review row order

**Expected result:**
- Executive (`priority_level` highest) appears before marketing/operational/generic
- Consistent with product prioritization rules

### TC-LOG-004: discovered_at column sort ascending/descending

**Type:** Business Logic  
**Priority:** Medium  
**Preconditions:**
- Multiple contacts with different timestamps

**Test data:**
- Sort toggle on discovered_at

**Steps:**
1. Sort by discovered_at descending
2. Sort ascending

**Expected result:**
- Row order changes correctly
- Newest-first default if documented

---

_Generated using Cursor skill **testcase-generation** · **File:** `contacts-page.md`_
