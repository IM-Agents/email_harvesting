# Functional Test Cases — Domain Detail Page

## Metadata
- **Source:** `docs/frontend-requirements.md` (Domain Detail), `docs/api-endpoints.md` (GET `/domains/{id}`, contacts, retry), `docs/automation-workflow.md`
- **Stack:** React 18 SPA, REST `/api/v1`, Playwright automation
- **Route:** `/domains/:domainId`
- **API base:** `/api/v1`
- **Coverage:** Domain metadata, source timeline, contacts, retry failed — TC-POS-001–006, TC-NEG-001–005, TC-EDGE-001–004, TC-LOG-001–004

## Positive Test Cases

### TC-POS-001: Domain detail shows normalized domain and original store URL

**Type:** UI | API  
**Priority:** High  
**Preconditions:**
- Logged in as admin
- Domain record exists with known `domainId`

**Test data:**
- `domainId`: domain with store URL `https://shop.example.com/path`
- Auth: default admin

**Steps:**
1. Navigate to `/domains/:domainId`
2. Wait for GET `/api/v1/domains/{domainId}`

**Expected result:**
- Original store URL displayed
- Normalized domain shown (e.g., `example.com`)
- Company name field populated when discovered
- Batch association link back to parent batch if shown

### TC-POS-002: Source attempts timeline displays discovery order

**Type:** UI  
**Priority:** High  
**Preconditions:**
- Domain processed through multi-source workflow

**Test data:**
- Domain with Snov → Apollo → LinkedIn → Website attempts logged

**Steps:**
1. Open domain detail
2. Inspect source attempts timeline component

**Expected result:**
- Sources listed in order: Snov.io, Apollo, LinkedIn, Website Crawl
- Each attempt shows status, timestamp, and outcome
- Successful source indicated before fallbacks

### TC-POS-003: Discovered contacts list for domain

**Type:** UI | API  
**Priority:** High  
**Preconditions:**
- Domain with at least 2 contacts

**Test data:**
- `domainId` with contacts

**Steps:**
1. View contacts section on domain detail
2. Compare with GET `/api/v1/domains/{domainId}/contacts`

**Expected result:**
- Contacts show email, name, job title, source, priority_level
- Selected/prioritized contacts highlighted if UI distinguishes them
- Count matches API response

### TC-POS-004: Selected contacts reflect executive prioritization

**Type:** Business Logic | UI  
**Priority:** High  
**Preconditions:**
- Domain with executive and non-executive contacts

**Test data:**
- Contacts with varying `priority_level`

**Steps:**
1. Open domain detail selected contacts section

**Expected result:**
- Executive-level contacts ranked first
- Minimum target of 2 contacts per company reflected when available

### TC-POS-005: Retry failed domain processing

**Type:** UI | API  
**Priority:** High  
**Preconditions:**
- Domain in failed status (e.g., `timeout`, `login_failed`)

**Test data:**
- Failed `domainId`

**Steps:**
1. Open failed domain detail
2. Click Retry
3. Confirm POST `/api/v1/domains/{domainId}/retry`

**Expected result:**
- Retry accepted; domain status moves to pending/running
- Timeline appends new attempt entries after retry completes

### TC-POS-006: Copyable error details for failed domain

**Type:** UI | UX  
**Priority:** Medium  
**Preconditions:**
- Domain with error details (login_failed, captcha_detected, proxy_failed)

**Test data:**
- Failed domain with error message

**Steps:**
1. View error details section
2. Use copy action if provided

**Expected result:**
- Error message human-readable and copyable
- Includes source and failure code per audit log

## Negative Test Cases

### TC-NEG-001: Domain detail for non-existent domainId

**Type:** UI | API  
**Priority:** High  
**Preconditions:**
- Logged in

**Test data:**
- `domainId`: invalid id

**Steps:**
1. Navigate to `/domains/999999999`

**Expected result:**
- Not found UI state
- No partial data rendered

### TC-NEG-002: Retry on successfully completed domain

**Type:** UI | API  
**Priority:** Medium  
**Preconditions:**
- Domain status `success`

**Test data:**
- Successful domain

**Steps:**
1. Attempt Retry on successful domain

**Expected result:**
- Retry disabled or confirmation warns of re-processing
- If allowed, creates new attempt without data loss documented

### TC-NEG-003: Unauthenticated access to domain detail

**Type:** UI | Security  
**Priority:** High  
**Preconditions:**
- No session

**Test data:**
- Valid domain id

**Steps:**
1. Open `/domains/:domainId` logged out

**Expected result:**
- Redirect to `/login`

### TC-NEG-004: Domain API failure shows error state

**Type:** UI | API  
**Priority:** Medium  
**Preconditions:**
- Simulate 500 on GET `/domains/{id}`

**Test data:**
- Mock API failure

**Steps:**
1. Load domain page under failure

**Expected result:**
- Error banner with retry option
- Timeline and contacts not shown with fake data

### TC-NEG-005: Access domain from another user's batch (if multi-tenant)

**Type:** Security  
**Priority:** Medium  
**Preconditions:**
- Multi-user isolation enforced

**Test data:**
- Domain id belonging to different user

**Steps:**
1. Request domain detail as non-owner user

**Expected result:**
- 403 or not found
- No contact data leaked

## Edge Cases

### TC-EDGE-001: Domain with zero contacts after all sources exhausted

**Type:** UI | Business Logic  
**Priority:** High  
**Preconditions:**
- Domain status `insufficient_contacts` or all sources failed

**Test data:**
- Zero-contact domain

**Steps:**
1. Open domain detail

**Expected result:**
- Empty contacts state with explanation
- Timeline shows all sources attempted
- Error/status reflects insufficient contacts

### TC-EDGE-002: Domain with captcha_detected on one source only

**Type:** UI  
**Priority:** Medium  
**Preconditions:**
- Snov attempt captcha; later source succeeded

**Test data:**
- Partial failure timeline

**Steps:**
1. Review timeline entries

**Expected result:**
- Captcha failure on Snov attempt logged
- Fallback sources still shown
- Final contacts attributed to successful source

### TC-EDGE-003: Domain with very long company name and URL

**Type:** UI  
**Priority:** Low  
**Preconditions:**
- Domain metadata with 200+ char fields

**Test data:**
- Long strings

**Steps:**
1. Render domain detail page

**Expected result:**
- Layout intact; text wraps or truncates with expand

### TC-EDGE-004: Domain still processing (in-flight)

**Type:** UI  
**Priority:** Medium  
**Preconditions:**
- Domain status `running` or `pending`

**Test data:**
- In-progress domain

**Steps:**
1. Open domain detail during processing
2. Refresh after completion

**Expected result:**
- Processing indicator shown while running
- Timeline and contacts populate as attempts complete
- Page updates on refresh without stale running state

## Logical Validation Cases

### TC-LOG-001: Timeline order matches strict source fallback rules

**Type:** Business Logic  
**Priority:** High  
**Preconditions:**
- Domain with full fallback chain executed

**Test data:**
- Audit log entries

**Steps:**
1. Compare timeline order to product rule: Snov → Apollo → LinkedIn → Website
2. Verify processing stopped early if minimum contacts reached

**Expected result:**
- No source runs out of documented order
- Later sources skipped if threshold met early (when implemented)

### TC-LOG-002: Domain contacts subset of batch contacts for same domain

**Type:** Business Logic  
**Priority:** High  
**Preconditions:**
- Batch contacts list includes domain

**Test data:**
- Shared domain across batch and domain views

**Steps:**
1. GET `/api/v1/batches/{batchId}/contacts?domain=example.com`
2. GET `/api/v1/domains/{domainId}/contacts`
3. Compare records

**Expected result:**
- Same contact ids and fields on both endpoints
- No orphan contacts on domain page

### TC-LOG-003: Retry increments attempt count without duplicating contacts incorrectly

**Type:** Business Logic  
**Priority:** Medium  
**Preconditions:**
- Failed domain retried once

**Test data:**
- Domain before/after retry

**Steps:**
1. Record contacts count before retry
2. Retry and wait for completion
3. Compare contacts list

**Expected result:**
- New timeline attempt added
- Contacts deduplicated by email/id on merge
- No duplicate rows for same email unless documented

### TC-LOG-004: Navigate from batch domain list to domain detail and back

**Type:** Business Logic  
**Priority:** Medium  
**Preconditions:**
- Batch with domain list

**Test data:**
- `batchId`, `domainId`

**Steps:**
1. From `/batches/:batchId` open domain row
2. Land on `/domains/:domainId`
3. Navigate back to batch

**Expected result:**
- Browser history or breadcrumb returns to same batch context
- Batch id preserved in navigation

---

_Generated using Cursor skill **testcase-generation** · **File:** `domain-detail-page.md`_
