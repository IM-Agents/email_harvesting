# Functional Test Cases — Reports Page

## Metadata
- **Source:** `docs/frontend-requirements.md` (Reports), `docs/api-endpoints.md` (GET `/batches/{id}/report`, audit-logs)
- **Stack:** React 18 SPA, REST `/api/v1`, Playwright automation
- **Route:** `/reports`
- **API base:** `/api/v1`
- **Coverage:** Discovery rate, executive rate, source breakdown, failure metrics — TC-POS-001–006, TC-NEG-001–005, TC-EDGE-001–004, TC-LOG-001–004

## Positive Test Cases

### TC-POS-001: Reports page displays batch-level metrics for selected batch

**Type:** UI | API  
**Priority:** High  
**Preconditions:**
- Logged in as `admin@emailharvest.local` / `admin123`
- At least one completed batch with contacts

**Test data:**
- Completed `batchId` with known stats

**Steps:**
1. Navigate to `/reports`
2. Select batch from dropdown or list
3. Wait for GET `/api/v1/batches/{batchId}/report`

**Expected result:**
- Metrics displayed: contact discovery rate, executive contact rate, contacts per source, failure rate, average processing time, invalid URL count
- Values match API report response fields

### TC-POS-002: Contact discovery rate calculation displayed

**Type:** UI | Business Logic  
**Priority:** High  
**Preconditions:**
- Batch with `valid_domains` and `contacts_found` known

**Test data:**
- Batch report data

**Steps:**
1. Load report for batch
2. Read discovery rate metric

**Expected result:**
- Rate expressed as percentage or ratio (contacts per domain)
- Formula consistent with `contacts_found / valid_domains` (or documented variant)
- Non-zero batch shows meaningful rate

### TC-POS-003: Executive contact rate metric visible

**Type:** UI | Business Logic  
**Priority:** High  
**Preconditions:**
- Batch with executive and non-executive contacts

**Test data:**
- Batch containing executive priority contacts

**Steps:**
1. View executive contact rate on reports page

**Expected result:**
- Executive rate shown separately from overall discovery rate
- Reflects proportion of executive-level contacts among total contacts

### TC-POS-004: Contacts per source breakdown chart or table

**Type:** UI  
**Priority:** High  
**Preconditions:**
- Batch with contacts from multiple sources

**Test data:**
- Sources: snov, apollo, linkedin, website

**Steps:**
1. Open reports for batch
2. Inspect source breakdown section

**Expected result:**
- Count per source matches report API `contacts per source` object
- Visual chart/table labels match source names
- Sum of source counts equals total contacts (or documented subset)

### TC-POS-005: Failure rate and invalid URL count displayed

**Type:** UI  
**Priority:** High  
**Preconditions:**
- Batch with failed domains and invalid upload rows

**Test data:**
- Batch with `failed_domains > 0`, `invalid_rows > 0`

**Steps:**
1. Load batch report

**Expected result:**
- Failure rate reflects failed domains vs valid domains processed
- Invalid URL count matches upload validation `invalid_rows`
- Metrics visually distinct (warning styling if applicable)

### TC-POS-006: Average processing time per domain shown

**Type:** UI | API  
**Priority:** Medium  
**Preconditions:**
- Completed batch with timing data

**Test data:**
- Batch report `average processing time`

**Steps:**
1. View average processing time metric

**Expected result:**
- Time displayed in human-readable units (seconds/ms)
- Matches API report field within rounding

## Negative Test Cases

### TC-NEG-001: Reports page without authentication

**Type:** UI | Security  
**Priority:** High  
**Preconditions:**
- No auth token

**Test data:**
- None

**Steps:**
1. Navigate to `/reports`

**Expected result:**
- Redirect to `/login`

### TC-NEG-002: Select batch with no report data (never started)

**Type:** UI | API  
**Priority:** High  
**Preconditions:**
- Batch in `queued` status only

**Test data:**
- Queued batch id

**Steps:**
1. Attempt to view report for queued batch

**Expected result:**
- Empty state or message: report available after processing starts/completes
- No fabricated metrics

### TC-NEG-003: Report API returns error

**Type:** UI | API  
**Priority:** High  
**Preconditions:**
- Simulate 500 on GET `/batches/{id}/report`

**Test data:**
- API failure mock

**Steps:**
1. Load reports page with failing API

**Expected result:**
- User-visible error with retry
- Charts not shown with zero placeholders misleadingly labeled as real

### TC-NEG-004: Invalid batchId in report selector

**Type:** UI | Validation  
**Priority:** Medium  
**Preconditions:**
- Manipulate batch selector or URL param to invalid id

**Test data:**
- Invalid batch id

**Steps:**
1. Request report for non-existent batch

**Expected result:**
- Not found handling
- No JS exception

### TC-NEG-005: Viewer role access to reports (if restricted)

**Type:** Authorization  
**Priority:** Medium  
**Preconditions:**
- Viewer account if reports are role-gated

**Test data:**
- Viewer credentials

**Steps:**
1. Open `/reports` as viewer

**Expected result:**
- Access per role policy: either full read-only reports or forbidden message

## Edge Cases

### TC-EDGE-001: Batch with zero contacts discovered

**Type:** UI | Business Logic  
**Priority:** High  
**Preconditions:**
- Completed batch, all domains failed or insufficient contacts

**Test data:**
- Zero-contact batch

**Steps:**
1. Load report

**Expected result:**
- Discovery rate shows 0% (not NaN)
- Executive rate 0%
- Source breakdown empty or all zeros
- Failure rate may be high — still renders coherently

### TC-EDGE-002: Batch with 100% executive contacts

**Type:** UI  
**Priority:** Low  
**Preconditions:**
- Unusual seed: all contacts executive priority

**Test data:**
- All-executive batch

**Steps:**
1. View executive contact rate

**Expected result:**
- Executive rate 100% (or 1.0)
- Discovery rate still independent metric

### TC-EDGE-003: Switch between batches updates all widgets

**Type:** UI  
**Priority:** Medium  
**Preconditions:**
- Two batches with different stats

**Test data:**
- `batchId` A and B

**Steps:**
1. View report for batch A
2. Switch selector to batch B

**Expected result:**
- All metrics refresh to batch B values
- No stale data from batch A in any chart

### TC-EDGE-004: Reports page responsive on mobile

**Type:** UI  
**Priority:** Medium  
**Preconditions:**
- Mobile viewport

**Test data:**
- Completed batch

**Steps:**
1. Open `/reports` on mobile width

**Expected result:**
- Charts/tables stack vertically without horizontal scroll
- Batch selector usable on touch

## Logical Validation Cases

### TC-LOG-001: Report totals reconcile with batch detail page

**Type:** Business Logic  
**Priority:** High  
**Preconditions:**
- Same batch open on detail and reports

**Test data:**
- Shared `batchId`

**Steps:**
1. Record contacts_found, failed_domains on `/batches/:batchId`
2. Open `/reports` for same batch
3. Compare metrics

**Expected result:**
- contacts_found, failure metrics, invalid counts match batch detail
- Source breakdown sums to contacts_found

### TC-LOG-002: Audit log link or section aligns with source breakdown

**Type:** Business Logic  
**Priority:** Medium  
**Preconditions:**
- Batch with audit logs (GET `/batches/{batchId}/audit-logs`)

**Test data:**
- Filter audit by source

**Steps:**
1. Compare source attempt counts in audit logs vs report source breakdown

**Expected result:**
- Successful contact attributions per source consistent between report and audit summary
- Failed attempts reflected in failure rate context

### TC-LOG-003: Invalid URL count matches upload validation on batch

**Type:** Business Logic  
**Priority:** High  
**Preconditions:**
- Batch uploaded with known invalid row count

**Test data:**
- Batch with `invalid_rows: 50` from upload response

**Steps:**
1. Check invalid URL count on reports page

**Expected result:**
- Invalid URL count equals upload-time `invalid_rows`
- Does not double-count domain processing failures

### TC-LOG-004: Export report or download summary if action available

**Type:** Business Logic  
**Priority:** Medium  
**Preconditions:**
- Batch with `include_report: true` export option

**Test data:**
- CSV export with report

**Steps:**
1. From reports or linked export action, generate report export
2. Download file

**Expected result:**
- Export contains summary metrics matching on-screen report
- File format matches selected csv/xlsx

---

_Generated using Cursor skill **testcase-generation** · **File:** `reports-page.md`_
