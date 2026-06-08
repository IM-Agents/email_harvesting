# Functional Test Cases — Batch Detail Page

## Metadata
- **Source:** `docs/frontend-requirements.md` (Batch Detail), `docs/api-endpoints.md` (GET `/batches/{id}`, pause/resume/start/cancel, exports)
- **Stack:** React 18 SPA, REST `/api/v1`, Playwright automation
- **Route:** `/batches/:batchId`
- **API base:** `/api/v1`
- **Coverage:** Progress tracking, domain counts, pause/resume, export actions — TC-POS-001–006, TC-NEG-001–006, TC-EDGE-001–004, TC-LOG-001–004

## Positive Test Cases

### TC-POS-001: Batch detail displays metadata and progress for processing batch

**Type:** UI | API  
**Priority:** High  
**Preconditions:**
- Logged in as admin
- Batch in `processing` status with known `batchId`

**Test data:**
- `batchId`: active processing batch
- Auth: `admin@emailharvest.local` / `admin123`

**Steps:**
1. Navigate to `/batches/:batchId`
2. Wait for GET `/api/v1/batches/{batchId}` to complete

**Expected result:**
- Fields shown: uploaded file name, status, total_rows, valid_domains, invalid_rows, processed_domains, contacts_found, failed_domains, created_at
- Progress bar reflects `processed_domains / valid_domains`
- Domain status counts and contacts per source sections visible

### TC-POS-002: Pause processing batch

**Type:** UI | API  
**Priority:** High  
**Preconditions:**
- Batch currently `processing`

**Test data:**
- `batchId`: processing batch

**Steps:**
1. Open batch detail page
2. Click Pause
3. Confirm action if modal shown

**Expected result:**
- POST `/api/v1/batches/{batchId}/pause` succeeds
- Status updates to `paused` in UI
- Progress bar stops advancing until resume

### TC-POS-003: Resume paused batch

**Type:** UI | API  
**Priority:** High  
**Preconditions:**
- Batch in `paused` status

**Test data:**
- `batchId`: paused batch

**Steps:**
1. Open `/batches/:batchId`
2. Click Resume

**Expected result:**
- POST `/api/v1/batches/{batchId}/resume` succeeds
- Status returns to `processing`
- Progress updates resume on refresh or live poll

### TC-POS-004: Export CSV from batch detail when contacts exist

**Type:** UI | API  
**Priority:** High  
**Preconditions:**
- Completed or partially processed batch with `contacts_found > 0`

**Test data:**
- `batchId`: batch with contacts
- Export format: `csv`

**Steps:**
1. Open batch detail
2. Click Export CSV (or open export actions)
3. Submit export request with `include_report: true`

**Expected result:**
- POST `/api/v1/batches/{batchId}/exports` returns `export_id`, `status: queued`
- UI shows export progress or download link when ready via GET `/api/v1/exports/{exportId}`

### TC-POS-005: Export XLSX from batch detail

**Type:** UI | API  
**Priority:** High  
**Preconditions:**
- Batch with available contacts/reports

**Test data:**
- Export format: `xlsx`

**Steps:**
1. Trigger XLSX export from batch detail
2. Wait for generation complete
3. Download via GET `/api/v1/exports/{exportId}/download`

**Expected result:**
- File downloads with `.xlsx` extension
- Contains expected contact columns per functional spec

### TC-POS-006: Navigate to domain list for batch

**Type:** UI  
**Priority:** Medium  
**Preconditions:**
- Batch with multiple domains

**Test data:**
- `batchId` with domain records

**Steps:**
1. On batch detail, open domains section or link
2. Filter or paginate domain list (GET `/api/v1/batches/{batchId}/domains`)

**Expected result:**
- Domain rows show status, domain name, link to `/domains/:domainId`
- Pagination works with `page` and `limit` query params

## Negative Test Cases

### TC-NEG-001: Batch detail for non-existent batchId

**Type:** UI | API  
**Priority:** High  
**Preconditions:**
- Logged in

**Test data:**
- `batchId`: `999999999`

**Steps:**
1. Navigate to `/batches/999999999`

**Expected result:**
- GET returns not found error
- UI shows 404 or friendly not-found message
- No crash; link back to dashboard/upload

### TC-NEG-002: Pause batch that is not processing

**Type:** UI | API  
**Priority:** High  
**Preconditions:**
- Batch in `completed` or `queued` status

**Test data:**
- Completed batch id

**Steps:**
1. Open completed batch detail
2. Attempt Pause if button visible

**Expected result:**
- Pause control disabled or API returns business rule error
- Status unchanged

### TC-NEG-003: Resume batch that is not paused

**Type:** UI | API  
**Priority:** High  
**Preconditions:**
- Batch `processing` or `completed`

**Test data:**
- Non-paused batch

**Steps:**
1. Attempt Resume on non-paused batch

**Expected result:**
- Resume disabled or API error
- No duplicate processing jobs started

### TC-NEG-004: Export when no contacts and no report data

**Type:** UI | Business Logic  
**Priority:** High  
**Preconditions:**
- Batch with zero contacts and no completed report

**Test data:**
- Empty queued batch never started

**Steps:**
1. Open batch detail
2. Attempt export

**Expected result:**
- Export button disabled per UX requirements OR export queued with empty sheet warning
- User informed exports require contacts/reports when unavailable

### TC-NEG-005: Unauthenticated access to batch detail

**Type:** UI | Security  
**Priority:** High  
**Preconditions:**
- No auth token

**Test data:**
- Valid batch id

**Steps:**
1. Navigate to `/batches/:batchId` logged out

**Expected result:**
- Redirect to `/login`
- API returns 401

### TC-NEG-006: Cancel batch confirmation dismissed

**Type:** UI  
**Priority:** Medium  
**Preconditions:**
- Processing batch with cancel action

**Test data:**
- Processing batch

**Steps:**
1. Click Cancel batch
2. Dismiss confirmation modal

**Expected result:**
- Batch continues processing
- Status unchanged

## Edge Cases

### TC-EDGE-001: Live progress polling during long batch

**Type:** UI | Performance  
**Priority:** High  
**Preconditions:**
- Large batch processing (100+ domains)

**Test data:**
- Long-running batch

**Steps:**
1. Open batch detail
2. Observe progress without manual refresh for 60s

**Expected result:**
- `processed_domains` and progress bar update via polling or websocket
- No memory leak from excessive polling intervals

### TC-EDGE-002: Batch completes while user on detail page

**Type:** UI | Business Logic  
**Priority:** High  
**Preconditions:**
- Batch near completion

**Test data:**
- Final domains processing

**Steps:**
1. Stay on detail page until batch finishes

**Expected result:**
- Status transitions to `completed`
- `completed_at` populated
- Export actions enabled if contacts exist
- Pause/Resume controls update appropriately

### TC-EDGE-003: Batch with 100% failed domains

**Type:** UI  
**Priority:** Medium  
**Preconditions:**
- Batch where all domains failed discovery

**Test data:**
- All-failed batch seed

**Steps:**
1. Open batch detail

**Expected result:**
- `failed_domains` equals `valid_domains`
- Failure count prominently displayed
- Export still behaves per rules (may export failures report)

### TC-EDGE-004: Very long uploaded file name in header

**Type:** UI  
**Priority:** Low  
**Preconditions:**
- Batch with 150+ char filename

**Test data:**
- Long filename batch

**Steps:**
1. View batch metadata section

**Expected result:**
- Filename truncates gracefully without layout break
- Full name accessible via title attribute or detail expand

## Logical Validation Cases

### TC-LOG-001: Pause then resume preserves processed_domains count

**Type:** Business Logic  
**Priority:** High  
**Preconditions:**
- Processing batch with known processed count

**Test data:**
- Record `processed_domains` before pause

**Steps:**
1. Pause batch at N processed domains
2. Wait 30 seconds
3. Resume and wait for more progress

**Expected result:**
- Count does not decrease on pause
- After resume, count continues from N (no reset)

### TC-LOG-002: Export download contains batch contacts matching UI count

**Type:** Business Logic  
**Priority:** High  
**Preconditions:**
- Completed batch with known `contacts_found`

**Test data:**
- CSV export

**Steps:**
1. Note `contacts_found` on batch detail
2. Download CSV export
3. Count data rows (excluding header)

**Expected result:**
- Export row count matches contacts list (allowing for column filters if any)
- Required columns present: store_url, domain, email, contact_name, job_title, source, priority_level

### TC-LOG-003: Cancel batch stops further domain processing

**Type:** Business Logic  
**Priority:** High  
**Preconditions:**
- Processing batch

**Test data:**
- Active batch

**Steps:**
1. POST `/api/v1/batches/{batchId}/cancel`
2. Monitor `processed_domains` over time

**Expected result:**
- Status becomes `cancelled` (or documented terminal state)
- Processed count stabilizes; no new domains processed

### TC-LOG-004: Batch detail metrics match GET `/batches/{batchId}/report`

**Type:** Business Logic  
**Priority:** Medium  
**Preconditions:**
- Completed batch

**Test data:**
- Batch with report available

**Steps:**
1. Load batch detail metrics (success rate, avg processing time, contacts per source)
2. Fetch GET `/api/v1/batches/{batchId}/report`
3. Compare values

**Expected result:**
- Contacts per source totals match report breakdown
- Success/failure rates consistent between UI and API report

---

_Generated using Cursor skill **testcase-generation** · **File:** `batch-detail-page.md`_
