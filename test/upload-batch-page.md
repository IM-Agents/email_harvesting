# Functional Test Cases — Upload Batch Page

## Metadata
- **Source:** `docs/frontend-requirements.md` (Upload Batch), `docs/api-endpoints.md` (POST `/batches/upload`, POST `/batches/{id}/start`), `docs/product-requirements.md` (Input Processing)
- **Stack:** React 18 SPA, REST `/api/v1`, multipart upload, Playwright automation
- **Route:** `/upload`
- **API base:** `/api/v1`
- **Required column:** `store_url`
- **Accepted formats:** CSV, XLS, XLSX
- **Coverage:** File upload, validation, parse preview, start processing — TC-POS-001–006, TC-NEG-001–006, TC-EDGE-001–005, TC-LOG-001–004

## Positive Test Cases

### TC-POS-001: Upload valid CSV with store_url column via drag-and-drop

**Type:** UI | API  
**Priority:** High  
**Preconditions:**
- Logged in as admin
- Sample CSV with header `store_url` and 10 valid HTTPS URLs

**Test data:**
- File: `valid-stores.csv`
- Rows: 10 valid store URLs

**Steps:**
1. Navigate to `/upload`
2. Drag CSV into upload drop zone
3. Wait for parse/validation response

**Expected result:**
- POST `/api/v1/batches/upload` returns `success: true`
- Response includes `batch_id`, `status: queued`, `total_rows`, `valid_domains`, `invalid_rows`
- UI shows validation summary matching API counts
- Start processing button becomes available

### TC-POS-002: Upload valid XLSX file with store_url column

**Type:** UI | API  
**Priority:** High  
**Preconditions:**
- Logged in
- Excel file `.xlsx` with `store_url` column

**Test data:**
- File: `stores.xlsx`

**Steps:**
1. Open `/upload`
2. Select XLSX via file picker
3. Confirm upload completes

**Expected result:**
- Upload accepted (extension `.xlsx`)
- Parse results displayed
- `batch_id` assigned

### TC-POS-003: Upload valid XLS file with store_url column

**Type:** UI | API  
**Priority:** High  
**Preconditions:**
- Logged in
- Legacy `.xls` spreadsheet with required column

**Test data:**
- File: `stores.xls`

**Steps:**
1. Upload XLS through file input
2. Review validation panel

**Expected result:**
- File type accepted per product spec
- Domains extracted and duplicate count shown if applicable

### TC-POS-004: Page displays upload requirements before file selection

**Type:** UI  
**Priority:** Medium  
**Preconditions:**
- User on `/upload` without file selected

**Test data:**
- None

**Steps:**
1. Load `/upload`
2. Read hints above drop zone

**Expected result:**
- Accepted formats listed: CSV, XLS, XLSX
- Required column `store_url` documented clearly
- Drag-and-drop area and browse button visible

### TC-POS-005: Start processing after successful upload

**Type:** UI | API  
**Priority:** High  
**Preconditions:**
- Batch created in `queued` status from valid upload

**Test data:**
- `batch_id` from TC-POS-001

**Steps:**
1. After upload validation, click Start Processing
2. Observe navigation or status update

**Expected result:**
- POST `/api/v1/batches/{batchId}/start` returns `status: processing`
- User redirected to `/batches/:batchId` or status updates inline
- Batch no longer merely queued

### TC-POS-006: Invalid row report shown after parse with mixed valid/invalid URLs

**Type:** UI  
**Priority:** High  
**Preconditions:**
- CSV with 8 valid and 2 invalid rows (malformed URL, empty store_url)

**Test data:**
- File: `mixed-validity.csv`

**Steps:**
1. Upload file
2. Review invalid URL report section

**Expected result:**
- `invalid_rows` count is 2
- `valid_domains` reflects deduplicated valid entries
- UI lists or summarizes invalid rows with reason
- User can still start processing for valid domains

## Negative Test Cases

### TC-NEG-001: Upload file missing store_url column

**Type:** UI | API | Validation  
**Priority:** High  
**Preconditions:**
- Logged in
- CSV with column `website` only (no `store_url`)

**Test data:**
- File: `no-store-url-column.csv`

**Steps:**
1. Upload file on `/upload`

**Expected result:**
- API returns validation error: `store_url column is required` (or equivalent)
- UI shows blocking error; batch not created or not startable
- Start processing disabled

### TC-NEG-002: Upload unsupported file type (.pdf)

**Type:** UI | Validation  
**Priority:** High  
**Preconditions:**
- Logged in

**Test data:**
- File: `document.pdf`

**Steps:**
1. Attempt upload via file picker or drop

**Expected result:**
- Client rejects before upload OR API returns extension error
- Clear message: only CSV/XLS/XLSX allowed
- No batch created

### TC-NEG-003: Upload empty CSV file

**Type:** UI | Validation  
**Priority:** High  
**Preconditions:**
- Logged in

**Test data:**
- Zero-byte or header-only CSV

**Steps:**
1. Upload empty file

**Expected result:**
- Validation error: no data rows / empty file
- No processing start allowed

### TC-NEG-004: Start processing without uploading a file

**Type:** UI  
**Priority:** Medium  
**Preconditions:**
- `/upload` in initial state

**Test data:**
- None

**Steps:**
1. Attempt to click Start Processing without upload

**Expected result:**
- Button disabled or click shows prompt to upload first
- No API start call issued

### TC-NEG-005: Upload while unauthenticated

**Type:** UI | Security  
**Priority:** High  
**Preconditions:**
- No auth session

**Test data:**
- Valid CSV

**Steps:**
1. Navigate to `/upload` and attempt upload

**Expected result:**
- Redirect to `/login`
- POST `/api/v1/batches/upload` returns 401 if called directly

### TC-NEG-006: Upload file exceeding size limit (if configured)

**Type:** UI | API  
**Priority:** Medium  
**Preconditions:**
- Server max upload size configured

**Test data:**
- Oversized CSV (> limit)

**Steps:**
1. Upload oversized file

**Expected result:**
- Graceful error message about file size
- No partial batch corruption

## Edge Cases

### TC-EDGE-001: CSV with duplicate store_url domains

**Type:** Business Logic  
**Priority:** High  
**Preconditions:**
- CSV with same domain repeated in multiple rows

**Test data:**
- 5 rows, 3 unique domains after normalization

**Steps:**
1. Upload CSV
2. Compare `total_rows` vs `valid_domains`

**Expected result:**
- Duplicates removed in valid domain count
- UI notes duplicate removal per product requirements

### TC-EDGE-002: store_url column with varied URL formats

**Type:** Business Logic  
**Priority:** High  
**Preconditions:**
- URLs with http/https, trailing slashes, paths, subdomains

**Test data:**
- Mixed URL formats pointing to same root domain

**Steps:**
1. Upload and inspect normalized domain preview if shown

**Expected result:**
- Domains normalized to root where possible
- Invalid: localhost, internal IPs, malformed strings rejected

### TC-EDGE-003: Very large batch (1000+ rows)

**Type:** UI | Performance  
**Priority:** Medium  
**Preconditions:**
- Large valid CSV available

**Test data:**
- 1200 row file per API doc example

**Steps:**
1. Upload large file
2. Wait for parse completion

**Expected result:**
- Upload completes without timeout
- Summary shows `total_rows: 1200` (or actual count)
- UI remains responsive; progress indicator during parse

### TC-EDGE-004: Filename with special characters and unicode

**Type:** UI  
**Priority:** Low  
**Preconditions:**
- Logged in

**Test data:**
- File: `mağaza-urls_2026 (1).csv`

**Steps:**
1. Upload file with special filename

**Expected result:**
- Upload succeeds
- Batch detail later shows sanitized or original filename consistently

### TC-EDGE-005: Cancel upload mid-flight (if supported)

**Type:** UI  
**Priority:** Low  
**Preconditions:**
- Large file uploading

**Test data:**
- Slow network simulation

**Steps:**
1. Start upload
2. Cancel or navigate away if cancel control exists

**Expected result:**
- Upload aborts cleanly
- No orphan batch or partial state without user confirmation

## Logical Validation Cases

### TC-LOG-001: Upload → start → batch appears on dashboard

**Type:** Business Logic  
**Priority:** High  
**Preconditions:**
- Admin logged in

**Test data:**
- Valid CSV

**Steps:**
1. Upload on `/upload` and start processing
2. Navigate to `/dashboard`

**Expected result:**
- New batch listed in recent activity with `processing` or `queued` status
- Total batch count incremented

### TC-LOG-002: Re-upload same file creates new batch (idempotency)

**Type:** Business Logic  
**Priority:** Medium  
**Preconditions:**
- Prior batch from same file exists

**Test data:**
- Same CSV uploaded twice

**Steps:**
1. Upload file first time and note `batch_id`
2. Upload identical file again

**Expected result:**
- Second upload creates distinct `batch_id`
- Both batches visible in system (no silent dedupe unless documented)

### TC-LOG-003: Validation counts sum logically

**Type:** Business Logic  
**Priority:** High  
**Preconditions:**
- Mixed validity CSV uploaded

**Test data:**
- Known row counts

**Steps:**
1. After upload, record `total_rows`, `valid_domains`, `invalid_rows`
2. Verify against file contents

**Expected result:**
- `invalid_rows` + valid parsed rows align with `total_rows` accounting rules
- No negative counts

### TC-LOG-004: Keyboard-accessible file selection and start

**Type:** Accessibility | Business Logic  
**Priority:** Medium  
**Preconditions:**
- Logged in

**Test data:**
- Valid CSV via keyboard-only interaction

**Steps:**
1. Tab to file input / browse button and select file
2. Tab to Start Processing and activate

**Expected result:**
- Full upload-start flow completable without mouse
- Focus indicators visible on interactive elements

---

_Generated using Cursor skill **testcase-generation** · **File:** `upload-batch-page.md`_
